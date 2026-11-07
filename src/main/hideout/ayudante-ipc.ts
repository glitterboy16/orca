// Hideout: Ayudante flotante. Cada pregunta lanza `claude -p` (modo print, solo
// lectura) con la captura de la ventana y la vista activa como contexto; la
// conversación continúa entre preguntas vía --resume con el session_id guardado.
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron'
import { withCliRuntimeOnPath } from '../../shared/node-cli-command-resolution'
import {
  HIDEOUT_AYUDANTE_PREGUNTAR,
  HIDEOUT_AYUDANTE_REINICIAR,
  type AyudantePregunta,
  type AyudanteRespuesta
} from '../../shared/hideout-ayudante'
import { resolveClaudeCommand } from '../codex-cli/command'
import { buildWindowsCommandInvocation } from '../claude-accounts/windows-command-invocation'

const TIEMPO_MAXIMO_MS = 240_000
const HERRAMIENTAS_PERMITIDAS = 'Read,Glob,Grep'

let registrado = false
let ocupado = false

function archivoSesion(): string {
  return join(app.getPath('userData'), 'hideout-ayudante.json')
}

function sesionGuardada(): string | null {
  try {
    const datos = JSON.parse(readFileSync(archivoSesion(), 'utf8')) as { sesionId?: string }
    return typeof datos.sesionId === 'string' && datos.sesionId ? datos.sesionId : null
  } catch {
    return null
  }
}

function guardarSesion(sesionId: string | null): void {
  try {
    if (sesionId === null) {
      rmSync(archivoSesion(), { force: true })
    } else {
      writeFileSync(archivoSesion(), JSON.stringify({ sesionId }))
    }
  } catch {
    // Sin persistencia la conversación solo pierde memoria entre arranques.
  }
}

async function capturarPantalla(event: IpcMainInvokeEvent): Promise<string | null> {
  const ventana = BrowserWindow.fromWebContents(event.sender)
  if (!ventana) {
    return null
  }
  const imagen = await ventana.webContents.capturePage()
  const ancho = imagen.getSize().width
  const reducida = ancho > 1400 ? imagen.resize({ width: 1400 }) : imagen
  const carpeta = join(app.getPath('temp'), 'hideout-ayudante')
  mkdirSync(carpeta, { recursive: true })
  const ruta = join(carpeta, 'pantalla.png')
  writeFileSync(ruta, reducida.toPNG())
  return ruta
}

function construirPrompt(
  datos: AyudantePregunta,
  rutaCaptura: string | null,
  esNuevaConversacion: boolean
): string {
  const raizCodigo = app.isPackaged ? null : app.getAppPath()
  const lineas = [
    ...(esNuevaConversacion
      ? [
          'Eres el Ayudante de Hideout, un IDE de agentes (fork personal de Orca, Electron + React) que usa Claude Code como motor. Angel te pregunta desde un chat flotante dentro de la propia app.',
          'Responde en español, claro y breve, sin tecnicismos innecesarios. Solo tienes herramientas de lectura: explica, no propongas ejecutar nada.',
          ...(raizCodigo
            ? [
                `El código fuente de la app está en ${raizCodigo} (lo propio de Hideout vive en carpetas hideout/). Úsalo cuando pregunte por código u opciones de la app.`
              ]
            : [])
        ]
      : []),
    `Vista activa de la app ahora mismo: ${datos.vista}.`,
    ...(rutaCaptura
      ? [
          `Captura actual de la ventana: ${rutaCaptura} — léela con Read si la pregunta va de algo que se ve en pantalla.`
        ]
      : []),
    '',
    'Pregunta de Angel:',
    datos.pregunta
  ]
  return lineas.join('\n')
}

function ejecutarClaude(prompt: string, reanudar: string | null): Promise<string> {
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
      env: withCliRuntimeOnPath(comando, { ...process.env }),
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsVerbatimArguments: invocacion.windowsVerbatimArguments,
      // Sin esto cada pregunta abriría y cerraría una ventana de consola.
      windowsHide: true
    })
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

function interpretarSalida(salida: string): { texto: string; sesionId: string | null } {
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

async function responder(
  event: IpcMainInvokeEvent,
  datos: AyudantePregunta
): Promise<AyudanteRespuesta> {
  const rutaCaptura = datos.incluirCaptura ? await capturarPantalla(event) : null
  const reanudar = sesionGuardada()
  const prompt = construirPrompt(datos, rutaCaptura, reanudar === null)
  let salida: string
  try {
    salida = await ejecutarClaude(prompt, reanudar)
  } catch (error) {
    // Si la sesión guardada ya no existe (borrada, otro perfil), se reintenta en limpio.
    if (reanudar === null) {
      throw error
    }
    guardarSesion(null)
    salida = await ejecutarClaude(construirPrompt(datos, rutaCaptura, true), null)
  }
  const resultado = interpretarSalida(salida)
  if (resultado.sesionId) {
    guardarSesion(resultado.sesionId)
  }
  return { ok: true, texto: resultado.texto }
}

export function registerHideoutAyudanteHandlers(): void {
  // El arranque puede repetirse al recrear la ventana; se registra una vez.
  if (registrado) {
    return
  }
  registrado = true
  ipcMain.handle(
    HIDEOUT_AYUDANTE_PREGUNTAR,
    async (event, datos: AyudantePregunta): Promise<AyudanteRespuesta> => {
      if (ocupado) {
        return { ok: false, error: 'Ya hay una pregunta en curso; espera a que termine.' }
      }
      ocupado = true
      try {
        return await responder(event, datos)
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) }
      } finally {
        ocupado = false
      }
    }
  )
  ipcMain.handle(HIDEOUT_AYUDANTE_REINICIAR, () => {
    guardarSesion(null)
  })
}
