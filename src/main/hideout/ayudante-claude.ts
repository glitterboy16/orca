// Hideout: ejecución de `claude -p` para el Ayudante. Modo print con salida
// stream-json para retransmitir el progreso (qué archivo lee, qué busca) al
// chat en vivo; el prompt entra por stdin para esquivar las comillas de
// cmd.exe. Si hay API key configurada se usa en vez de la suscripción.
import { spawn } from 'node:child_process'
import { basename } from 'node:path'
import { withCliRuntimeOnPath } from '../../shared/node-cli-command-resolution'
import { buildWindowsCommandInvocation } from '../claude-accounts/windows-command-invocation'
import { resolveClaudeCommand } from '../codex-cli/command'

const TIEMPO_MAXIMO_MS = 240_000
const HERRAMIENTAS_PERMITIDAS = 'Read,Glob,Grep'

/** PIDs del árbol propio en curso (cmd + claude del Ayudante), para no matarse a sí mismo. */
export const pidsPropios = new Set<number>()

export function ejecutarClaude(
  prompt: string,
  reanudar: string | null,
  apiKey: string | undefined,
  onProgreso?: (texto: string) => void
): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const comando = resolveClaudeCommand()
    const args = [
      '-p',
      '--output-format',
      'stream-json',
      '--verbose',
      '--allowedTools',
      HERRAMIENTAS_PERMITIDAS,
      '--max-turns',
      '12',
      ...(reanudar ? ['--resume', reanudar] : [])
    ]
    const invocacion =
      process.platform === 'win32'
        ? buildWindowsCommandInvocation(comando, args)
        : { command: comando, args, windowsVerbatimArguments: false }
    const hijo = spawn(invocacion.command, invocacion.args, {
      env: withCliRuntimeOnPath(comando, {
        ...process.env,
        ...(apiKey ? { ANTHROPIC_API_KEY: apiKey } : {})
      }),
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsVerbatimArguments: invocacion.windowsVerbatimArguments,
      // Sin esto cada pregunta abriría y cerraría una ventana de consola.
      windowsHide: true
    })
    if (hijo.pid) {
      pidsPropios.add(hijo.pid)
    }
    let salida = ''
    let errores = ''
    let pendiente = ''
    let cerrado = false
    const temporizador = setTimeout(() => {
      cerrado = true
      matar(hijo.pid)
      rechazar(
        new Error('El ayudante tardó demasiado (4 min). Prueba con una pregunta más concreta.')
      )
    }, TIEMPO_MAXIMO_MS)
    hijo.stdout.on('data', (trozo: Buffer) => {
      const texto = trozo.toString()
      salida = `${salida}${texto}`
      if (!onProgreso) {
        return
      }
      // Los eventos llegan como NDJSON; se retransmite el paso en curso al chat.
      pendiente = `${pendiente}${texto}`
      const lineas = pendiente.split('\n')
      pendiente = lineas.pop() ?? ''
      for (const linea of lineas) {
        const progreso = progresoDeLinea(linea)
        if (progreso) {
          onProgreso(progreso)
        }
      }
    })
    hijo.stderr.on('data', (trozo: Buffer) => {
      errores = `${errores}${trozo.toString()}`.slice(-2_000)
    })
    hijo.on('error', (error) => {
      clearTimeout(temporizador)
      if (!cerrado) {
        cerrado = true
        rechazar(error)
      }
    })
    hijo.on('close', (codigo) => {
      clearTimeout(temporizador)
      if (hijo.pid) {
        pidsPropios.delete(hijo.pid)
      }
      if (cerrado) {
        return
      }
      cerrado = true
      if (codigo === 0) {
        resolver(salida)
      } else {
        rechazar(new Error(errores.trim() || salida.trim() || `claude salió con código ${codigo}`))
      }
    })
    hijo.stdin.on('error', () => {
      // Un EPIPE al morir el hijo no debe tumbar el proceso principal.
    })
    hijo.stdin.write(prompt)
    hijo.stdin.end()
  })
}

type BloqueMensaje = {
  type?: string
  text?: string
  name?: string
  input?: { file_path?: string; pattern?: string }
}

/** Traduce un evento stream-json al paso que se enseña en el chat. */
function progresoDeLinea(linea: string): string | null {
  let datos: { type?: string; subtype?: string; message?: { content?: BloqueMensaje[] } }
  try {
    datos = JSON.parse(linea) as typeof datos
  } catch {
    return null
  }
  if (datos.type === 'system' && datos.subtype === 'init') {
    return 'Pensando…'
  }
  if (datos.type !== 'assistant') {
    return null
  }
  let progreso: string | null = null
  for (const bloque of datos.message?.content ?? []) {
    if (bloque.type === 'text' && bloque.text?.trim()) {
      progreso = 'Escribiendo la respuesta…'
    }
    if (bloque.type !== 'tool_use') {
      continue
    }
    if (bloque.name === 'Read') {
      const archivo = basename(bloque.input?.file_path ?? '')
      progreso = archivo === 'pantalla.png' ? 'Mirando tu pantalla…' : `Leyendo ${archivo}…`
    } else if (bloque.name === 'Grep') {
      progreso = `Buscando «${(bloque.input?.pattern ?? '').slice(0, 40)}» en el código…`
    } else if (bloque.name === 'Glob') {
      progreso = 'Explorando archivos…'
    } else {
      progreso = `Usando ${bloque.name ?? 'una herramienta'}…`
    }
  }
  return progreso
}

function matar(pid: number | undefined): void {
  if (!pid) {
    return
  }
  if (process.platform === 'win32') {
    // El hijo directo es cmd.exe; /t remata también al claude que cuelga de él.
    spawn('taskkill', ['/pid', String(pid), '/t', '/f'], { stdio: 'ignore', windowsHide: true })
  } else {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {
      // Ya había terminado.
    }
  }
}

export function interpretarSalida(salida: string): { texto: string; sesionId: string | null } {
  // --output-format json imprime un único objeto; por robustez se busca la
  // última línea parseable con type "result".
  const lineas = salida
    .split('\n')
    .map((linea) => linea.trim())
    .filter(Boolean)
  for (const linea of lineas.toReversed()) {
    try {
      const datos = JSON.parse(linea) as {
        type?: string
        result?: string
        is_error?: boolean
        session_id?: string
      }
      if (datos.type === 'result') {
        if (datos.is_error) {
          throw new Error(datos.result || 'El ayudante devolvió un error.')
        }
        return { texto: datos.result ?? '(sin respuesta)', sesionId: datos.session_id ?? null }
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        continue
      }
      throw error
    }
  }
  throw new Error(`Respuesta ilegible del CLI: ${salida.slice(0, 400)}`)
}
