import { lstat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { AiVaultSessionDeleteRemoval } from '../../shared/ai-vault-session-deletion'
import { sessionRowRootDirs } from './session-scanner-agent-sources'
import type { AiVaultScanOptions } from './session-scanner-types'

// Hideout: un rollout de Codex vive replicado (hardlinks del bridge de cuentas, copias del
// backfill y espejos WSL) con el mismo nombre bajo la misma ruta de fecha en cada home de
// Codex. Borrar un solo alias deja vivos los demás y la sesión reaparece en el siguiente
// escaneo; por eso el borrado expande a todos los alias existentes antes del canónico.

const CODEX_ROLLOUT_DATED_NAME = /^rollout-(\d{4})-(\d{2})-(\d{2})T.+\.jsonl$/

const CODEX_ROLLOUT_THREAD_ID =
  /^rollout-.+-([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\.jsonl$/

// Hosts escanean rutas de otras plataformas; separa con ambos separadores, sin node:path.
export function codexRolloutFileName(filePath: string): string {
  return filePath.split(/[\\/]/).at(-1) ?? ''
}

/** El UUID del thread va embebido en el nombre del rollout; null si el nombre no lo trae. */
export function codexRolloutThreadId(filePath: string): string | null {
  const match = CODEX_ROLLOUT_THREAD_ID.exec(codexRolloutFileName(filePath))
  return match ? match[1].toLowerCase() : null
}

export type ExpandCodexSessionDeleteRemovalsArgs = {
  resolvedPath: string
  rootOptions?: AiVaultScanOptions
  wslHomeDirs?: readonly string[]
}

/** Alias primero y transcript canónico al final, igual que el contrato de companions. */
export async function expandCodexSessionDeleteRemovals(
  args: ExpandCodexSessionDeleteRemovalsArgs
): Promise<readonly AiVaultSessionDeleteRemoval[]> {
  const roots = sessionRowRootDirs('codex', args.rootOptions ?? {}, args.wslHomeDirs ?? [])
    .filter((rootDir) => rootDir.trim().length > 0)
    .map((rootDir) => resolve(rootDir))
  const canonical: AiVaultSessionDeleteRemoval = {
    path: args.resolvedPath,
    kind: 'file',
    roots
  }

  const fileName = codexRolloutFileName(args.resolvedPath)
  const dated = CODEX_ROLLOUT_DATED_NAME.exec(fileName)
  if (!dated) {
    return [canonical]
  }
  const [, year, month, day] = dated

  const aliases: AiVaultSessionDeleteRemoval[] = []
  for (const root of roots) {
    // El bridge y el backfill conservan la ruta relativa de fecha, así que el alias es determinista.
    const candidate = join(root, year, month, day, fileName)
    if (resolve(candidate) === args.resolvedPath) {
      continue
    }
    try {
      const stats = await lstat(candidate)
      if (!stats.isFile()) {
        continue
      }
    } catch {
      continue
    }
    aliases.push({ path: candidate, kind: 'file', roots: [root] })
  }
  return [...aliases, canonical]
}
