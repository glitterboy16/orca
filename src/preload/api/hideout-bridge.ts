import { ipcRenderer } from 'electron'
import { HIDEOUT_CONSUMO_CHANNEL, type ConsumoResumen } from '../../shared/hideout-consumo'
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
import {
  HIDEOUT_PROYECTOS_ABRIR,
  HIDEOUT_PROYECTOS_CHANNEL,
  type ProyectosResumen
} from '../../shared/hideout-proyectos'
import type { PreloadApi } from '../api-types'

export const hideoutApi = {
  proyectosResumen: (): Promise<ProyectosResumen> => ipcRenderer.invoke(HIDEOUT_PROYECTOS_CHANNEL),
  proyectosAbrir: (ruta: string): Promise<void> =>
    ipcRenderer.invoke(HIDEOUT_PROYECTOS_ABRIR, ruta),
  consumoResumen: (): Promise<ConsumoResumen> => ipcRenderer.invoke(HIDEOUT_CONSUMO_CHANNEL),
  ayudantePreguntar: (datos: AyudantePregunta): Promise<AyudanteRespuesta> =>
    ipcRenderer.invoke(HIDEOUT_AYUDANTE_PREGUNTAR, datos),
  ayudanteReiniciar: (): Promise<void> => ipcRenderer.invoke(HIDEOUT_AYUDANTE_REINICIAR),
  ayudanteConfig: (): Promise<AyudanteConfig> => ipcRenderer.invoke(HIDEOUT_AYUDANTE_CONFIG),
  ayudanteApiKey: (apiKey: string | null): Promise<void> =>
    ipcRenderer.invoke(HIDEOUT_AYUDANTE_API_KEY, apiKey),
  ayudanteOnProgreso: (callback: (texto: string) => void): (() => void) => {
    const oyente = (_evento: Electron.IpcRendererEvent, texto: string): void => callback(texto)
    ipcRenderer.on(HIDEOUT_AYUDANTE_PROGRESO, oyente)
    return () => ipcRenderer.removeListener(HIDEOUT_AYUDANTE_PROGRESO, oyente)
  }
} satisfies PreloadApi['hideout']
