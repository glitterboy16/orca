import { link, mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import {
  codexRolloutThreadId,
  expandCodexSessionDeleteRemovals
} from './codex-session-delete-aliases'

const ROLLOUT_NAME = 'rollout-2026-03-10T16-51-57-019cd872-a17d-7f72-9c15-734bb6799a5f.jsonl'
const DATE_SEGMENTS = ['2026', '03', '10'] as const

describe('codexRolloutThreadId', () => {
  it('extrae el UUID del nombre del rollout', () => {
    expect(codexRolloutThreadId(ROLLOUT_NAME)).toBe('019cd872-a17d-7f72-9c15-734bb6799a5f')
    expect(codexRolloutThreadId(join('C:', 'x', ROLLOUT_NAME))).toBe(
      '019cd872-a17d-7f72-9c15-734bb6799a5f'
    )
  })

  it('devuelve null si el nombre no trae UUID', () => {
    expect(codexRolloutThreadId('rollout-1.jsonl')).toBeNull()
    expect(codexRolloutThreadId('session.jsonl')).toBeNull()
  })
})

describe('expandCodexSessionDeleteRemovals', () => {
  let realRoot: string
  let managedRoot: string
  let canonicalPath: string
  let aliasPath: string

  beforeAll(async () => {
    const base = await mkdtemp(join(tmpdir(), 'hideout-codex-aliases-'))
    realRoot = join(base, 'real-home', 'sessions')
    managedRoot = join(base, 'managed-home', 'sessions')
    const realDateDir = join(realRoot, ...DATE_SEGMENTS)
    const managedDateDir = join(managedRoot, ...DATE_SEGMENTS)
    await mkdir(realDateDir, { recursive: true })
    await mkdir(managedDateDir, { recursive: true })
    canonicalPath = join(realDateDir, ROLLOUT_NAME)
    aliasPath = join(managedDateDir, ROLLOUT_NAME)
    await writeFile(canonicalPath, '{"type":"session_meta"}\n')
    // El bridge de cuentas replica por hardlink con la misma ruta de fecha.
    await link(canonicalPath, aliasPath)
  })

  it('incluye el alias de la otra home y deja el canónico al final', async () => {
    const removals = await expandCodexSessionDeleteRemovals({
      resolvedPath: resolve(canonicalPath),
      rootOptions: {
        codexSessionsDir: realRoot,
        additionalCodexSessionsDirs: [managedRoot]
      }
    })

    expect(removals).toHaveLength(2)
    expect(removals[0]).toEqual({
      path: join(resolve(managedRoot), ...DATE_SEGMENTS, ROLLOUT_NAME),
      kind: 'file',
      roots: [resolve(managedRoot)]
    })
    expect(removals[1]).toMatchObject({ path: resolve(canonicalPath), kind: 'file' })
  })

  it('un alias inexistente no genera removal', async () => {
    const removals = await expandCodexSessionDeleteRemovals({
      resolvedPath: resolve(aliasPath),
      rootOptions: {
        codexSessionsDir: join(realRoot, '..', 'no-existe', 'sessions'),
        additionalCodexSessionsDirs: [managedRoot]
      }
    })
    expect(removals).toHaveLength(1)
    expect(removals[0]).toMatchObject({ path: resolve(aliasPath), kind: 'file' })
  })

  it('un nombre sin fecha no expande alias', async () => {
    const undatedPath = join(realRoot, 'rollout-1.jsonl')
    await writeFile(undatedPath, '{}\n')
    const removals = await expandCodexSessionDeleteRemovals({
      resolvedPath: resolve(undatedPath),
      rootOptions: {
        codexSessionsDir: realRoot,
        additionalCodexSessionsDirs: [managedRoot]
      }
    })
    expect(removals).toHaveLength(1)
  })
})
