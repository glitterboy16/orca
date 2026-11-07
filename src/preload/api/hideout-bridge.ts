import { ipcRenderer } from 'electron'
import { HIDEOUT_CONSUMO_CHANNEL, type ConsumoResumen } from '../../shared/hideout-consumo'
import type { PreloadApi } from '../api-types'

export const hideoutApi = {
  consumoResumen: (): Promise<ConsumoResumen> => ipcRenderer.invoke(HIDEOUT_CONSUMO_CHANNEL)
} satisfies PreloadApi['hideout']
