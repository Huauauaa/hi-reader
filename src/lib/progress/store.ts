import { idb } from '../idb'
import type { ReadingProgress } from '../../types/book'

export const progressStore = {
  async get(bookId: string): Promise<ReadingProgress | null> {
    const p = await idb.getProgress(bookId)
    return p ?? null
  },
  async save(p: ReadingProgress): Promise<void> {
    await idb.putProgress(p)
  },
}

/** Test-only — clears all reading progress from IDB */
export async function clearAllProgressForTests(): Promise<void> {
  await idb.clearProgress()
}
