import { ipcMain } from 'electron'
import { HIDEOUT_CONSUMO_CHANNEL } from '../../shared/hideout-consumo'
import { escanearConsumo } from './consumo-scan'

let registrado = false

export function registerHideoutConsumoHandlers(): void {
  // El arranque puede repetirse al recrear la ventana; el handler se registra una vez.
  if (registrado) {
    return
  }
  registrado = true
  ipcMain.handle(HIDEOUT_CONSUMO_CHANNEL, () => escanearConsumo())
}
