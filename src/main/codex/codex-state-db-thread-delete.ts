import SyncDatabase from '../sqlite/sync-database'
import { findNewestCodexStateDbPath } from './codex-state-db'

// Hideout: tras borrar los archivos rollout de una sesión, su thread debe salir también de
// state_N.sqlite; si queda, el propio Codex lo sigue listando y el backfill de rollouts
// puede rematerializar el archivo, con lo que la sesión "borrada" reaparece.

// Tablas auxiliares con clave thread_id; se limpian antes que threads y siempre best-effort.
const THREAD_ID_AUX_TABLES = [
  'thread_dynamic_tools',
  'thread_attachments',
  'thread_read_receipts'
] as const

type ThreadRow = { id: string; rollout_path: string | null }

export type DeleteCodexThreadArgs = {
  codexHomePath: string
  /** Nombres de archivo de los rollouts borrados; casan threads cuyo rollout_path difiere por home. */
  rolloutFileNames: readonly string[]
  threadId: string | null
}

export type DeleteCodexThreadResult = {
  stateDbPath: string
  threadsDeleted: number
}

function lastPathSegment(filePath: string): string {
  return filePath.split(/[\\/]/).at(-1) ?? ''
}

/** Best-effort: una base ausente, bloqueada o con otro esquema nunca frena el borrado de archivos. */
export function deleteCodexThreadFromStateDb(
  args: DeleteCodexThreadArgs
): DeleteCodexThreadResult | null {
  const stateDbPath = findNewestCodexStateDbPath(args.codexHomePath)
  if (!stateDbPath) {
    return null
  }
  const wantedNames = new Set(args.rolloutFileNames.filter((name) => name.length > 0))
  const wantedId = args.threadId?.toLowerCase() ?? null
  if (!wantedId && wantedNames.size === 0) {
    return null
  }

  try {
    const db = new SyncDatabase(stateDbPath)
    try {
      const doomedIds = new Set<string>()
      const rows = db.prepare('SELECT id, rollout_path FROM threads').all() as ThreadRow[]
      for (const row of rows) {
        if (wantedId && row.id.toLowerCase() === wantedId) {
          doomedIds.add(row.id)
          continue
        }
        if (row.rollout_path && wantedNames.has(lastPathSegment(row.rollout_path))) {
          doomedIds.add(row.id)
        }
      }

      let threadsDeleted = 0
      for (const id of doomedIds) {
        for (const table of THREAD_ID_AUX_TABLES) {
          try {
            db.prepare(`DELETE FROM ${table} WHERE thread_id = ?`).run(id)
          } catch {
            // Esquemas viejos sin la tabla: irrelevante para el objetivo.
          }
        }
        try {
          db.prepare(
            'DELETE FROM thread_spawn_edges WHERE parent_thread_id = ? OR child_thread_id = ?'
          ).run(id, id)
        } catch {
          // Igual que arriba.
        }
        const result = db.prepare('DELETE FROM threads WHERE id = ?').run(id)
        threadsDeleted += Number(result.changes ?? 0)
      }
      return { stateDbPath, threadsDeleted }
    } finally {
      db.close()
    }
  } catch {
    return null
  }
}
