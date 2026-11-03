import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { deleteCodexThreadFromStateDb } from './codex-state-db-thread-delete'

const THREAD_A = '019cd872-a17d-7f72-9c15-734bb6799a5f'
const THREAD_B = '01a1798f-02d4-77d0-96b1-82a806dc8960'
const ROLLOUT_A = `rollout-2026-03-10T16-51-57-${THREAD_A}.jsonl`

async function seedStateDb(): Promise<string> {
  const home = await mkdtemp(join(tmpdir(), 'hideout-codex-state-db-'))
  const db = new DatabaseSync(join(home, 'state_3.sqlite'))
  db.exec(`
    CREATE TABLE threads (id TEXT PRIMARY KEY, rollout_path TEXT);
    CREATE TABLE thread_dynamic_tools (thread_id TEXT, name TEXT);
    CREATE TABLE thread_attachments (id TEXT, thread_id TEXT);
    CREATE TABLE thread_read_receipts (thread_id TEXT, revision INTEGER);
    CREATE TABLE thread_spawn_edges (parent_thread_id TEXT, child_thread_id TEXT);
  `)
  db.prepare('INSERT INTO threads (id, rollout_path) VALUES (?, ?)').run(
    THREAD_A,
    `C:\\Users\\x\\.codex\\sessions\\2026\\03\\10\\${ROLLOUT_A}`
  )
  db.prepare('INSERT INTO threads (id, rollout_path) VALUES (?, ?)').run(THREAD_B, null)
  db.prepare('INSERT INTO thread_dynamic_tools (thread_id, name) VALUES (?, ?)').run(THREAD_A, 't')
  db.prepare(
    'INSERT INTO thread_spawn_edges (parent_thread_id, child_thread_id) VALUES (?, ?)'
  ).run(THREAD_A, THREAD_B)
  db.close()
  return home
}

function remainingThreadIds(home: string): string[] {
  const db = new DatabaseSync(join(home, 'state_3.sqlite'), { readOnly: true })
  try {
    return (db.prepare('SELECT id FROM threads ORDER BY id').all() as { id: string }[]).map(
      (row) => row.id
    )
  } finally {
    db.close()
  }
}

describe('deleteCodexThreadFromStateDb', () => {
  it('olvida el thread casando por nombre de rollout y limpia sus tablas auxiliares', async () => {
    const home = await seedStateDb()
    const result = deleteCodexThreadFromStateDb({
      codexHomePath: home,
      rolloutFileNames: [ROLLOUT_A],
      threadId: null
    })

    expect(result?.threadsDeleted).toBe(1)
    expect(remainingThreadIds(home)).toEqual([THREAD_B])
    const db = new DatabaseSync(join(home, 'state_3.sqlite'), { readOnly: true })
    try {
      expect(db.prepare('SELECT COUNT(*) c FROM thread_dynamic_tools').get()).toEqual({ c: 0 })
      expect(db.prepare('SELECT COUNT(*) c FROM thread_spawn_edges').get()).toEqual({ c: 0 })
    } finally {
      db.close()
    }
  })

  it('casa por threadId aunque el rollout_path no coincida', async () => {
    const home = await seedStateDb()
    const result = deleteCodexThreadFromStateDb({
      codexHomePath: home,
      rolloutFileNames: ['otro-nombre.jsonl'],
      threadId: THREAD_B.toUpperCase()
    })

    expect(result?.threadsDeleted).toBe(1)
    expect(remainingThreadIds(home)).toEqual([THREAD_A])
  })

  it('devuelve null sin base de estado y nunca lanza', async () => {
    const home = await mkdtemp(join(tmpdir(), 'hideout-codex-no-db-'))
    expect(
      deleteCodexThreadFromStateDb({ codexHomePath: home, rolloutFileNames: ['x'], threadId: null })
    ).toBeNull()
  })
})
