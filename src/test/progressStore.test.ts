import 'fake-indexeddb/auto'
import { it, expect, beforeEach } from 'vitest'
import { progressStore, clearAllProgressForTests } from '../lib/progress/store'
import type { ReadingProgress } from '../types/book'

beforeEach(async () => {
  await clearAllProgressForTests()
})

function sample(over: Partial<ReadingProgress> = {}): ReadingProgress {
  return {
    bookId: 'sample-txt',
    page: 2,
    layout: 'double',
    theme: 'sepia',
    fontScale: 1.2,
    updatedAt: 1,
    ...over,
  }
}

it('get returns null when nothing saved', async () => {
  expect(await progressStore.get('missing')).toBeNull()
})

it('save then get round-trips progress', async () => {
  const p = sample()
  await progressStore.save(p)
  expect(await progressStore.get('sample-txt')).toEqual(p)
})

it('save overwrites previous progress for the same book', async () => {
  await progressStore.save(sample({ page: 0, theme: 'dark' }))
  await progressStore.save(sample({ page: 5, theme: 'light', updatedAt: 2 }))
  const got = await progressStore.get('sample-txt')
  expect(got?.page).toBe(5)
  expect(got?.theme).toBe('light')
})
