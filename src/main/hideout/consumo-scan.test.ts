import { describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, writeFile, utimes } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { escanearConsumoEnRaices } from './consumo-scan'

const linea = (obj: unknown): string => `${JSON.stringify(obj)}\n`

const turnoUsuario = (texto: string, ts: string) =>
  linea({
    type: 'user',
    timestamp: ts,
    cwd: 'C:\\clientes\\arkana',
    message: { role: 'user', content: texto }
  })

const turnoAsistente = (ts: string, usage: Record<string, number>, sidechain = false) =>
  linea({
    type: 'assistant',
    timestamp: ts,
    isSidechain: sidechain,
    cwd: 'C:\\clientes\\arkana',
    message: { role: 'assistant', model: 'claude-fable-5', usage }
  })

async function raizConSesion(contenido: string, nombre = 'sesion-1.jsonl'): Promise<string> {
  const raiz = await mkdtemp(join(tmpdir(), 'hideout-consumo-'))
  const proyecto = join(raiz, 'C--clientes-arkana')
  await mkdir(proyecto, { recursive: true })
  await writeFile(join(proyecto, nombre), contenido, 'utf8')
  return raiz
}

describe('escanearConsumoEnRaices', () => {
  it('agrega tokens, saca título y estima el contexto del último turno', async () => {
    const raiz = await raizConSesion(
      turnoUsuario('Monta la landing de Arkana', '2026-11-07T10:00:00.000Z') +
        turnoAsistente('2026-11-07T10:00:10.000Z', {
          input_tokens: 100,
          output_tokens: 50,
          cache_read_input_tokens: 1000,
          cache_creation_input_tokens: 200
        }) +
        turnoAsistente('2026-11-07T10:05:00.000Z', {
          input_tokens: 20,
          output_tokens: 80,
          cache_read_input_tokens: 1500,
          cache_creation_input_tokens: 10
        })
    )
    const resumen = await escanearConsumoEnRaices([raiz])
    expect(resumen.proyectos).toHaveLength(1)
    const proyecto = resumen.proyectos[0]
    expect(proyecto.nombre).toBe('arkana')
    expect(proyecto.entrada).toBe(120)
    expect(proyecto.salida).toBe(130)
    const sesion = proyecto.sesiones[0]
    expect(sesion.titulo).toBe('Monta la landing de Arkana')
    expect(sesion.modelo).toBe('claude-fable-5')
    expect(sesion.mensajes).toBe(2)
    expect(sesion.contexto).toBe(20 + 1500 + 10)
    expect(resumen.dias.length).toBeGreaterThan(0)
  })

  it('marca como olvidada una sesión parada con contexto cargado', async () => {
    const hace2Dias = new Date(Date.now() - 2 * 86_400_000).toISOString()
    const raiz = await raizConSesion(
      turnoUsuario('Chat abandonado con mucho contexto', hace2Dias) +
        turnoAsistente(hace2Dias, {
          input_tokens: 500,
          output_tokens: 100,
          cache_read_input_tokens: 90_000,
          cache_creation_input_tokens: 4_000
        })
    )
    // El mtime manda en ultimaActividad; retrásalo también.
    const archivo = join(raiz, 'C--clientes-arkana', 'sesion-1.jsonl')
    const viejo = new Date(Date.now() - 2 * 86_400_000)
    await utimes(archivo, viejo, viejo)
    const resumen = await escanearConsumoEnRaices([raiz])
    expect(resumen.proyectos[0].sesiones[0].olvidada).toBe(true)
  })

  it('ignora sidechains para el contexto y los títulos con pinta de sistema', async () => {
    const raiz = await raizConSesion(
      turnoUsuario('<system-reminder>cosas</system-reminder>', '2026-11-07T10:00:00.000Z') +
        turnoUsuario('La petición de verdad', '2026-11-07T10:00:05.000Z') +
        turnoAsistente('2026-11-07T10:00:10.000Z', {
          input_tokens: 10,
          output_tokens: 5,
          cache_read_input_tokens: 100,
          cache_creation_input_tokens: 0
        }) +
        turnoAsistente(
          '2026-11-07T10:00:20.000Z',
          {
            input_tokens: 9_999,
            output_tokens: 1,
            cache_read_input_tokens: 0,
            cache_creation_input_tokens: 0
          },
          true
        )
    )
    const resumen = await escanearConsumoEnRaices([raiz])
    const sesion = resumen.proyectos[0].sesiones[0]
    expect(sesion.titulo).toBe('La petición de verdad')
    // El sidechain suma tokens pero no pisa el contexto del hilo principal.
    expect(sesion.contexto).toBe(110)
    expect(sesion.entrada).toBe(10_009)
  })

  it('una raíz inexistente no rompe el resumen', async () => {
    const resumen = await escanearConsumoEnRaices([join(tmpdir(), 'no-existe-hideout')])
    expect(resumen.proyectos).toEqual([])
  })
})
