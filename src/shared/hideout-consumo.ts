// Hideout: panel de consumo. Lee los JSONL que Claude Code guarda en
// ~/.claude/projects y resume tokens por chat, proyecto y día (ideas 1, 3 y 5).

export const HIDEOUT_CONSUMO_CHANNEL = 'hideout:consumoResumen'

/** Una sesión de Claude Code (un archivo .jsonl). */
export type ConsumoSesion = {
  sessionId: string
  filePath: string
  titulo: string
  modelo: string
  mensajes: number
  entrada: number
  salida: number
  cacheLeida: number
  cacheEscrita: number
  /** Estimación del contexto actual: tokens de entrada del último mensaje del asistente. */
  contexto: number
  /** Epoch ms de la última actividad (último mensaje o mtime del archivo). */
  ultimaActividad: number
  /** Sin actividad reciente y con contexto cargado: candidata a cerrar o compactar. */
  olvidada: boolean
}

export type ConsumoProyecto = {
  /** Carpeta real del proyecto si se pudo leer del transcript; si no, el slug. */
  ruta: string
  nombre: string
  entrada: number
  salida: number
  cacheLeida: number
  cacheEscrita: number
  ultimaActividad: number
  sesiones: ConsumoSesion[]
}

export type ConsumoDia = {
  /** AAAA-MM-DD en hora local. */
  dia: string
  entrada: number
  salida: number
  cacheLeida: number
  cacheEscrita: number
}

export type ConsumoResumen = {
  generadoEn: number
  raices: string[]
  proyectos: ConsumoProyecto[]
  /** Últimos 14 días con actividad, el más reciente primero. */
  dias: ConsumoDia[]
}

/** Ventana de contexto de referencia para el semáforo (Claude Code ~200k). */
export const CONSUMO_CONTEXTO_LIMITE = 200_000

/** Horas sin actividad a partir de las cuales un chat con contexto se considera olvidado. */
export const CONSUMO_OLVIDO_HORAS = 12

/** Contexto mínimo (tokens) para que un chat parado cuente como olvidado. */
export const CONSUMO_OLVIDO_CONTEXTO_MIN = 30_000
