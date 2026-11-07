// Hideout: pestaña Proyectos. Lee la carpeta real de trabajo de Angel: las
// carpetas raíz son proyectos de clientes ("Cliente - Proyecto") y las de
// Personal\ son proyectos propios, marcados con su propio símbolo en la UI.

export const HIDEOUT_PROYECTOS_RAIZ = 'C:\\Users\\villo\\Desktop\\FREELACE'
export const HIDEOUT_PROYECTOS_CARPETA_PERSONAL = 'Personal'

export type ProyectoHideout = {
  nombre: string
  /** Cliente extraído de "Cliente - Proyecto"; null en los personales. */
  cliente: string | null
  tipo: 'cliente' | 'personal'
  ruta: string
  /** Última modificación de la carpeta (epoch ms). */
  modificado: number
  /** Último chat de Claude Code sobre esta carpeta (epoch ms), si lo hay. */
  ultimoChat: number | null
}

export type ProyectosResumen = {
  generadoEn: number
  raiz: string
  proyectos: ProyectoHideout[]
}

export const HIDEOUT_PROYECTOS_CHANNEL = 'hideout:proyectosResumen'
export const HIDEOUT_PROYECTOS_ABRIR = 'hideout:proyectosAbrir'
