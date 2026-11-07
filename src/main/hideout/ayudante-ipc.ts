// Hideout: Ayudante flotante. Cada pregunta lanza `claude -p` (solo lectura)
// con la captura de la ventana, la vista activa y las sesiones de Claude Code
// abiertas como contexto; la conversación continúa vía --resume. Además del
// texto, el Ayudante puede pedir acciones con marcas [[...]] que la app
// ejecuta de forma nativa (hoy: cerrar todas las sesiones abiertas).
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron'
import {
  HIDEOUT_AYUDANTE_API_KEY,
  HIDEOUT_AYUDANTE_CONFIG,
  HIDEOUT_AYUDANTE_PREGUNTAR,
  HIDEOUT_AYUDANTE_PROGRESO,
  HIDEOUT_AYUDANTE_REINICIAR,
  type AyudanteConfig,
  type AyudantePregunta,
  type AyudanteRespuesta
} from '../../shared/hideout-ayudante'
import { ejecutarClaude, interpretarSalida, pidsPropios } from './ayudante-claude'
import { guardarApiKey, guardarSesion, leerEstado } from './ayudante-estado'
import { cerrarSesionesClaude, describirSesiones, listarSesionesClaude } from './ayudante-sesiones'

const MARCA_CERRAR = '[[CERRAR_SESIONES]]'

let registrado = false
let ocupado = false

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
  sesionesAbiertas: string,
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
    `Sesiones de Claude Code en ejecución en esta máquina: ${sesionesAbiertas}.`,
    `Acción disponible: si Angel pide cerrar las sesiones/chats de Claude Code abiertos, incluye en tu respuesta una línea con exactamente ${MARCA_CERRAR} y la app las cerrará al recibirla (sustituye la marca por el resultado). No la uses sin que lo pida explícitamente.`,
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

async function ejecutarAcciones(texto: string): Promise<string> {
  if (!texto.includes(MARCA_CERRAR)) {
    return texto
  }
  let resultado: string
  try {
    const cerradas = await cerrarSesionesClaude(pidsPropios)
    resultado =
      cerradas.length === 0
        ? '✔ No había ninguna sesión abierta aparte de la mía.'
        : `✔ Cerradas ${cerradas.length} sesiones: ${cerradas.map((sesion) => `PID ${sesion.pid}`).join(', ')}.`
  } catch (error) {
    resultado = `✖ No pude cerrar las sesiones: ${error instanceof Error ? error.message : String(error)}`
  }
  return texto.replaceAll(MARCA_CERRAR, resultado)
}

async function responder(
  event: IpcMainInvokeEvent,
  datos: AyudantePregunta
): Promise<AyudanteRespuesta> {
  const rutaCaptura = datos.incluirCaptura ? await capturarPantalla(event) : null
  // Solo se listan los procesos (lanza PowerShell) si la pregunta va de sesiones;
  // así la pregunta normal no abre ninguna consola ni pierde tiempo.
  const hablaDeSesiones = /sesion|sesión|chat|abiert|cerrar|cierra|proceso/i.test(datos.pregunta)
  const sesionesAbiertas = hablaDeSesiones
    ? describirSesiones(await listarSesionesClaude())
    : 'no consultadas (pregunta no relacionada)'
  const estado = leerEstado()
  const reanudar = estado.sesionId ?? null
  // El paso en curso (leyendo X, buscando Y…) se retransmite al chat en vivo.
  const avisar = (texto: string): void => {
    if (!event.sender.isDestroyed()) {
      event.sender.send(HIDEOUT_AYUDANTE_PROGRESO, texto)
    }
  }
  let salida: string
  try {
    salida = await ejecutarClaude(
      construirPrompt(datos, rutaCaptura, sesionesAbiertas, reanudar === null),
      reanudar,
      estado.apiKey,
      avisar
    )
  } catch (error) {
    // Si la sesión guardada ya no existe (borrada, otro perfil), se reintenta en limpio.
    if (reanudar === null) {
      throw error
    }
    guardarSesion(null)
    salida = await ejecutarClaude(
      construirPrompt(datos, rutaCaptura, sesionesAbiertas, true),
      null,
      estado.apiKey,
      avisar
    )
  }
  const resultado = interpretarSalida(salida)
  if (resultado.sesionId) {
    guardarSesion(resultado.sesionId)
  }
  return { ok: true, texto: await ejecutarAcciones(resultado.texto) }
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
  ipcMain.handle(HIDEOUT_AYUDANTE_CONFIG, (): AyudanteConfig => {
    return { apiKeyConfigurada: Boolean(leerEstado().apiKey) }
  })
  ipcMain.handle(HIDEOUT_AYUDANTE_API_KEY, (_event, apiKey: string | null) => {
    guardarApiKey(apiKey)
  })
}
