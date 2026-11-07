// Hideout: Ayudante flotante — chat con Claude Code que ve lo que hay en
// pantalla (captura + vista activa) y puede leer el código de la app.

export type AyudantePregunta = {
  pregunta: string
  /** Vista activa de la app al preguntar (terminal, settings, consumo…). */
  vista: string
  /** Adjuntar una captura de la ventana para que el ayudante vea lo mismo. */
  incluirCaptura: boolean
}

export type AyudanteRespuesta = { ok: true; texto: string } | { ok: false; error: string }

export type AyudanteConfig = {
  /** Hay una API key de Anthropic guardada (en userData, nunca en el repo). */
  apiKeyConfigurada: boolean
}

export const HIDEOUT_AYUDANTE_PREGUNTAR = 'hideout:ayudantePreguntar'
export const HIDEOUT_AYUDANTE_REINICIAR = 'hideout:ayudanteReiniciar'
export const HIDEOUT_AYUDANTE_CONFIG = 'hideout:ayudanteConfig'
export const HIDEOUT_AYUDANTE_API_KEY = 'hideout:ayudanteApiKey'
