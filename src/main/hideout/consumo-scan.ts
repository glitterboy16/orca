// Hideout: escáner de consumo. Recorre ~/.claude/projects/*/*.jsonl y agrega
// tokens por sesión, proyecto y día. Cachea por (mtime, tamaño) para que
// refrescar el panel no relea gigas de transcripts.

import { createReadStream } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import { basename, join } from 'node:path'
import { claudeProjectsHostDirs } from '../ai-vault/session-scanner-roots'
import {
  CONSUMO_OLVIDO_CONTEXTO_MIN,
  CONSUMO_OLVIDO_HORAS,
  type ConsumoDia,
  type ConsumoProyecto,
  type ConsumoResumen,
  type ConsumoSesion
} from '../../shared/hideout-consumo'

type SesionAgg = {
  mtimeMs: number
  size: number
  sesion: ConsumoSesion
  cwd: string
  dias: Map<string, { entrada: number; salida: number; cacheLeida: number; cacheEscrita: number }>
}

const cache = new Map<string, SesionAgg>()

const diaLocal = (epochMs: number): string => {
  const d = new Date(epochMs)
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

function tituloDesdeContenido(content: unknown): string | null {
  const texto =
    typeof content === 'string'
      ? content
      : Array.isArray(content)
        ? content
            .map((p) => (p && typeof p === 'object' && 'text' in p ? String(p.text ?? '') : ''))
            .join(' ')
        : ''
  const limpio = texto.replace(/\s+/g, ' ').trim()
  // Mensajes de sistema disfrazados (recordatorios, comandos pegados) no sirven de título.
  if (!limpio || limpio.startsWith('<') || limpio.startsWith('Caveat:')) {
    return null
  }
  return limpio.length > 90 ? `${limpio.slice(0, 87)}…` : limpio
}

async function leerSesion(filePath: string, mtimeMs: number, size: number): Promise<SesionAgg> {
  const sesion: ConsumoSesion = {
    sessionId: basename(filePath, '.jsonl'),
    filePath,
    titulo: '',
    modelo: '',
    mensajes: 0,
    entrada: 0,
    salida: 0,
    cacheLeida: 0,
    cacheEscrita: 0,
    contexto: 0,
    ultimaActividad: mtimeMs,
    olvidada: false
  }
  const agg: SesionAgg = { mtimeMs, size, sesion, cwd: '', dias: new Map() }

  const rl = createInterface({
    input: createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity
  })
  for await (const linea of rl) {
    // Filtrado barato antes de pagar el JSON.parse: solo turnos con uso o el primer título.
    const esAsistente = linea.includes('"usage"') && linea.includes('"assistant"')
    const buscaTitulo = !sesion.titulo && linea.includes('"user"')
    if (!esAsistente && !buscaTitulo && agg.cwd) {
      continue
    }
    let j: Record<string, unknown>
    try {
      j = JSON.parse(linea) as Record<string, unknown>
    } catch {
      continue
    }
    if (!agg.cwd && typeof j.cwd === 'string') {
      agg.cwd = j.cwd
    }
    const message = j.message as Record<string, unknown> | undefined
    if (buscaTitulo && j.type === 'user' && j.isSidechain !== true && message) {
      const titulo = tituloDesdeContenido(message.content)
      if (titulo) {
        sesion.titulo = titulo
      }
    }
    if (!esAsistente || j.type !== 'assistant' || !message) {
      continue
    }
    const usage = message.usage as Record<string, unknown> | undefined
    if (!usage) {
      continue
    }
    const n = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
    const entrada = n(usage.input_tokens)
    const salida = n(usage.output_tokens)
    const cacheLeida = n(usage.cache_read_input_tokens)
    const cacheEscrita = n(usage.cache_creation_input_tokens)
    sesion.mensajes += 1
    sesion.entrada += entrada
    sesion.salida += salida
    sesion.cacheLeida += cacheLeida
    sesion.cacheEscrita += cacheEscrita
    if (typeof message.model === 'string') {
      sesion.modelo = message.model
    }
    const cuando = typeof j.timestamp === 'string' ? Date.parse(j.timestamp) : Number.NaN
    const epoch = Number.isFinite(cuando) ? cuando : mtimeMs
    sesion.ultimaActividad = Math.max(sesion.ultimaActividad, epoch)
    // El contexto del hilo principal es el del último turno sin sidechains.
    if (j.isSidechain !== true) {
      sesion.contexto = entrada + cacheLeida + cacheEscrita
    }
    const dia = diaLocal(epoch)
    const d = agg.dias.get(dia) ?? { entrada: 0, salida: 0, cacheLeida: 0, cacheEscrita: 0 }
    d.entrada += entrada
    d.salida += salida
    d.cacheLeida += cacheLeida
    d.cacheEscrita += cacheEscrita
    agg.dias.set(dia, d)
  }
  return agg
}

async function sesionesDeRaiz(raiz: string): Promise<SesionAgg[]> {
  let proyectos: string[]
  try {
    proyectos = (await readdir(raiz, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => join(raiz, e.name))
  } catch {
    return []
  }
  // Juntar todas las rutas y leerlas en paralelo: en la primera pasada (sin
  // cache) es la diferencia entre segundos y una espera larga.
  const rutas: string[] = []
  await Promise.all(
    proyectos.map(async (proyecto) => {
      try {
        for (const nombre of await readdir(proyecto)) {
          if (nombre.endsWith('.jsonl')) {
            rutas.push(join(proyecto, nombre))
          }
        }
      } catch {
        // Carpeta ilegible: se ignora.
      }
    })
  )
  const aggs = await Promise.all(rutas.map((filePath) => sesionDeArchivo(filePath)))
  return aggs.filter((agg): agg is SesionAgg => agg !== null)
}

async function sesionDeArchivo(filePath: string): Promise<SesionAgg | null> {
  try {
    const s = await stat(filePath)
    const previo = cache.get(filePath)
    if (previo && previo.mtimeMs === s.mtimeMs && previo.size === s.size) {
      return previo
    }
    const agg = await leerSesion(filePath, s.mtimeMs, s.size)
    cache.set(filePath, agg)
    return agg
  } catch {
    // Un transcript ilegible no tumba el panel.
    return null
  }
}

let ultimoResumen: ConsumoResumen | null = null
let escaneoEnCurso: Promise<ConsumoResumen> | null = null

export async function escanearConsumo(): Promise<ConsumoResumen> {
  return escanearConsumoEnRaices(claudeProjectsHostDirs())
}

/** Devuelve al instante el último resumen conocido y refresca por detrás; la
 * primera vez sí espera. Así el panel abre sin bloquear tras el arranque. */
export async function escanearConsumoRapido(): Promise<ConsumoResumen> {
  if (!escaneoEnCurso) {
    escaneoEnCurso = escanearConsumo()
      .then((r) => {
        ultimoResumen = r
        return r
      })
      .finally(() => {
        escaneoEnCurso = null
      })
  }
  return ultimoResumen ?? escaneoEnCurso
}

/** Lanza un escaneo al arrancar para tener el resumen listo (los per-file
 * quedan cacheados y las siguientes aperturas son instantáneas). */
export function precalentarConsumo(): void {
  void escanearConsumoRapido().catch(() => {
    // Si falla en el arranque, el panel reintentará al abrirse.
  })
}

export async function escanearConsumoEnRaices(raices: string[]): Promise<ConsumoResumen> {
  const todas: SesionAgg[] = []
  for (const raiz of raices) {
    todas.push(...(await sesionesDeRaiz(raiz)))
  }

  const ahora = Date.now()
  const umbralOlvido = ahora - CONSUMO_OLVIDO_HORAS * 3_600_000
  const porProyecto = new Map<string, ConsumoProyecto>()
  const porDia = new Map<string, ConsumoDia>()

  for (const agg of todas) {
    const s = agg.sesion
    if (s.mensajes === 0) {
      continue
    }
    s.olvidada = s.ultimaActividad < umbralOlvido && s.contexto >= CONSUMO_OLVIDO_CONTEXTO_MIN
    const ruta = agg.cwd || basename(join(s.filePath, '..'))
    const nombre = ruta.split(/[\\/]/).findLast((parte) => parte !== '') ?? ruta
    const proyecto = porProyecto.get(ruta) ?? {
      ruta,
      nombre,
      entrada: 0,
      salida: 0,
      cacheLeida: 0,
      cacheEscrita: 0,
      ultimaActividad: 0,
      sesiones: []
    }
    proyecto.entrada += s.entrada
    proyecto.salida += s.salida
    proyecto.cacheLeida += s.cacheLeida
    proyecto.cacheEscrita += s.cacheEscrita
    proyecto.ultimaActividad = Math.max(proyecto.ultimaActividad, s.ultimaActividad)
    proyecto.sesiones.push(s)
    porProyecto.set(ruta, proyecto)

    for (const [dia, d] of agg.dias) {
      const acc = porDia.get(dia) ?? {
        dia,
        entrada: 0,
        salida: 0,
        cacheLeida: 0,
        cacheEscrita: 0
      }
      acc.entrada += d.entrada
      acc.salida += d.salida
      acc.cacheLeida += d.cacheLeida
      acc.cacheEscrita += d.cacheEscrita
      porDia.set(dia, acc)
    }
  }

  const proyectos = [...porProyecto.values()].sort((a, b) => b.ultimaActividad - a.ultimaActividad)
  for (const p of proyectos) {
    p.sesiones.sort((a, b) => b.ultimaActividad - a.ultimaActividad)
  }
  const dias = [...porDia.values()].sort((a, b) => (a.dia < b.dia ? 1 : -1)).slice(0, 14)

  return { generadoEn: ahora, raices, proyectos, dias }
}
