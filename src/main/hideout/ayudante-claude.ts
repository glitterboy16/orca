// Hideout: ejecución de `claude -p` para el Ayudante. Modo print, salida JSON,
// herramientas de solo lectura; el prompt entra por stdin para esquivar las
// comillas de cmd.exe. Si hay API key configurada se usa en vez de la suscripción.
import { spawn } from 'node:child_process'
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
  apiKey: string | undefined
): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const comando = resolveClaudeCommand()
    const args = [
      '-p',
      '--output-format',
      'json',
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
    let cerrado = false
    const temporizador = setTimeout(() => {
      cerrado = true
      matar(hijo.pid)
      rechazar(
        new Error('El ayudante tardó demasiado (4 min). Prueba con una pregunta más concreta.')
      )
    }, TIEMPO_MAXIMO_MS)
    hijo.stdout.on('data', (trozo: Buffer) => {
      salida = `${salida}${trozo.toString()}`
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
