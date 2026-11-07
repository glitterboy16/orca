import { ipcMain } from 'electron'
import { HIDEOUT_CONSUMO_CHANNEL } from '../../shared/hideout-consumo'
import { escanearConsumoRapido, precalentarConsumo } from './consumo-scan'

let registrado = false

export function registerHideoutConsumoHandlers(): void {
  // El arranque puede repetirse al recrear la ventana; el handler se registra una vez.
  if (registrado) {
    return
  }
  registrado = true
  ipcMain.handle(HIDEOUT_CONSUMO_CHANNEL, () => escanearConsumoRapido())
  // Deja el resumen listo antes de que Angel abra el panel.
  precalentarConsumo()
}
