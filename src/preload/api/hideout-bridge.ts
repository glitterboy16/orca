import { ipcRenderer } from 'electron'
import { HIDEOUT_CONSUMO_CHANNEL, type ConsumoResumen } from '../../shared/hideout-consumo'
import {
  HIDEOUT_AYUDANTE_PREGUNTAR,
  HIDEOUT_AYUDANTE_REINICIAR,
  type AyudantePregunta,
  type AyudanteRespuesta
} from '../../shared/hideout-ayudante'
import type { PreloadApi } from '../api-types'

export const hideoutApi = {
  consumoResumen: (): Promise<ConsumoResumen> => ipcRenderer.invoke(HIDEOUT_CONSUMO_CHANNEL),
  ayudantePreguntar: (datos: AyudantePregunta): Promise<AyudanteRespuesta> =>
    ipcRenderer.invoke(HIDEOUT_AYUDANTE_PREGUNTAR, datos),
  ayudanteReiniciar: (): Promise<void> => ipcRenderer.invoke(HIDEOUT_AYUDANTE_REINICIAR)
} satisfies PreloadApi['hideout']
