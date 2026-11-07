// Hideout: estado persistente del Ayudante. Vive en userData (fuera del repo):
// la API key de Angel no pasa jamás por el código ni por los commits.
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'

type EstadoAyudante = {
  sesionId?: string
  apiKey?: string
}

function archivoEstado(): string {
  return join(app.getPath('userData'), 'hideout-ayudante.json')
}

export function leerEstado(): EstadoAyudante {
  try {
    const datos = JSON.parse(readFileSync(archivoEstado(), 'utf8')) as EstadoAyudante
    return {
      sesionId: typeof datos.sesionId === 'string' && datos.sesionId ? datos.sesionId : undefined,
      apiKey: typeof datos.apiKey === 'string' && datos.apiKey ? datos.apiKey : undefined
    }
  } catch {
    return {}
  }
}

function escribirEstado(estado: EstadoAyudante): void {
  try {
    if (!estado.sesionId && !estado.apiKey) {
      rmSync(archivoEstado(), { force: true })
    } else {
      writeFileSync(archivoEstado(), JSON.stringify(estado))
    }
  } catch {
    // Sin persistencia solo se pierde memoria entre arranques.
  }
}

export function guardarSesion(sesionId: string | null): void {
  escribirEstado({ ...leerEstado(), sesionId: sesionId ?? undefined })
}

export function guardarApiKey(apiKey: string | null): void {
  escribirEstado({ ...leerEstado(), apiKey: apiKey?.trim() ? apiKey.trim() : undefined })
}
