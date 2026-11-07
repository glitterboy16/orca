import { shell, ipcMain } from 'electron'
import {
  HIDEOUT_PROYECTOS_ABRIR,
  HIDEOUT_PROYECTOS_CHANNEL,
  HIDEOUT_PROYECTOS_RAIZ
} from '../../shared/hideout-proyectos'
import { escanearProyectos } from './proyectos-scan'

let registrado = false

export function registerHideoutProyectosHandlers(): void {
  // El arranque puede repetirse al recrear la ventana; se registra una vez.
  if (registrado) {
    return
  }
  registrado = true
  ipcMain.handle(HIDEOUT_PROYECTOS_CHANNEL, () => escanearProyectos())
  ipcMain.handle(HIDEOUT_PROYECTOS_ABRIR, async (_event, ruta: string) => {
    // Solo se abren carpetas de la raíz de proyectos, nada arbitrario.
    if (typeof ruta !== 'string' || !ruta.startsWith(HIDEOUT_PROYECTOS_RAIZ)) {
      return
    }
    await shell.openPath(ruta)
  })
}
