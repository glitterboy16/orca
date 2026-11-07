// Hideout: escáner de la pestaña Proyectos. Lee la carpeta FREELACE (raíz =
// clientes, Personal\ = propios) y cruza cada proyecto con ~/.claude/projects
// para enseñar cuándo fue el último chat de Claude Code sobre esa carpeta.
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  HIDEOUT_PROYECTOS_CARPETA_PERSONAL,
  HIDEOUT_PROYECTOS_RAIZ,
  type ProyectoHideout,
  type ProyectosResumen
} from '../../shared/hideout-proyectos'
import { claudeProjectsHostDirs } from '../ai-vault/session-scanner-roots'

/** El mismo troceado que usa Claude Code para nombrar la carpeta del proyecto. */
function slugDeRuta(ruta: string): string {
  return ruta.replaceAll(/[^a-zA-Z0-9]/g, '-').toLowerCase()
}

function ultimoJsonl(carpeta: string): number | null {
  let ultimo: number | null = null
  let archivos: string[]
  try {
    archivos = readdirSync(carpeta)
  } catch {
    return null
  }
  for (const archivo of archivos) {
    if (!archivo.endsWith('.jsonl')) {
      continue
    }
    try {
      const mtime = statSync(join(carpeta, archivo)).mtimeMs
      if (ultimo === null || mtime > ultimo) {
        ultimo = mtime
      }
    } catch {
      // Archivo borrado a mitad de escaneo.
    }
  }
  return ultimo
}

/** slug minúsculo de cada carpeta de chats → último chat (mtime del jsonl más nuevo). */
function mapaDeChats(): { slug: string; ultimo: number }[] {
  const entradas: { slug: string; ultimo: number }[] = []
  for (const raiz of claudeProjectsHostDirs()) {
    let carpetas: string[]
    try {
      carpetas = readdirSync(raiz)
    } catch {
      continue
    }
    for (const carpeta of carpetas) {
      const ultimo = ultimoJsonl(join(raiz, carpeta))
      if (ultimo !== null) {
        entradas.push({ slug: carpeta.toLowerCase(), ultimo })
      }
    }
  }
  return entradas
}

function ultimoChatDe(ruta: string, chats: { slug: string; ultimo: number }[]): number | null {
  const slug = slugDeRuta(ruta)
  let ultimo: number | null = null
  for (const chat of chats) {
    // Prefijo: también cuentan los chats abiertos en subcarpetas del proyecto.
    if (chat.slug === slug || chat.slug.startsWith(`${slug}-`)) {
      if (ultimo === null || chat.ultimo > ultimo) {
        ultimo = chat.ultimo
      }
    }
  }
  return ultimo
}

function proyectoDesde(
  carpeta: string,
  nombreCarpeta: string,
  tipo: 'cliente' | 'personal',
  chats: { slug: string; ultimo: number }[]
): ProyectoHideout | null {
  const ruta = join(carpeta, nombreCarpeta)
  let modificado: number
  try {
    const datos = statSync(ruta)
    if (!datos.isDirectory()) {
      return null
    }
    modificado = datos.mtimeMs
  } catch {
    return null
  }
  const separador = nombreCarpeta.indexOf(' - ')
  const cliente = tipo === 'cliente' && separador > 0 ? nombreCarpeta.slice(0, separador) : null
  const nombre =
    tipo === 'cliente' && separador > 0 ? nombreCarpeta.slice(separador + 3) : nombreCarpeta
  return { nombre, cliente, tipo, ruta, modificado, ultimoChat: ultimoChatDe(ruta, chats) }
}

export function escanearProyectos(raiz = HIDEOUT_PROYECTOS_RAIZ): ProyectosResumen {
  const chats = mapaDeChats()
  const proyectos: ProyectoHideout[] = []
  let nombres: string[] = []
  try {
    nombres = readdirSync(raiz)
  } catch {
    // Sin carpeta raíz la pestaña muestra el aviso de vacío.
  }
  for (const nombre of nombres) {
    if (nombre.startsWith('.')) {
      continue
    }
    if (nombre === HIDEOUT_PROYECTOS_CARPETA_PERSONAL) {
      let personales: string[] = []
      try {
        personales = readdirSync(join(raiz, nombre))
      } catch {
        continue
      }
      for (const personal of personales) {
        if (personal.startsWith('.')) {
          continue
        }
        const proyecto = proyectoDesde(join(raiz, nombre), personal, 'personal', chats)
        if (proyecto) {
          proyectos.push(proyecto)
        }
      }
      continue
    }
    const proyecto = proyectoDesde(raiz, nombre, 'cliente', chats)
    if (proyecto) {
      proyectos.push(proyecto)
    }
  }
  proyectos.sort((a, b) => (b.ultimoChat ?? b.modificado) - (a.ultimoChat ?? a.modificado))
  return { generadoEn: Date.now(), raiz, proyectos }
}
