import 'fake-indexeddb/auto'
import { it, expect, beforeEach, afterEach, vi } from 'vitest'
import { openSession } from '../lib/readers/openSession'
import { booksStore, clearAllBooksForTests } from '../lib/books/store'
import type { BookMeta } from '../types/book'

const sampleTxt: BookMeta = {
  id: 'sample-txt',
  title: '示例 TXT',
  format: 'txt',
  source: 'sample',
  filePath: 'books/sample.txt',
}

beforeEach(async () => {
  await clearAllBooksForTests()
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (String(url).endsWith('books/sample.txt')) {
        return { ok: true, blob: async () => new Blob(['hello from sample'], { type: 'text/plain' }) }
      }
      return { ok: false, status: 404, blob: async () => new Blob([]) }
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

it('opens a sample txt via fetch and filePath', async () => {
  const session = await openSession(sampleTxt)
  expect(session.format).toBe('txt')
  expect(session.title).toBe('示例 TXT')
  expect(session.getPage(0)).toEqual({ type: 'txt', htmlOrText: 'hello from sample' })
  session.destroy()
})

it('opens a local txt from booksStore', async () => {
  const file = new File(['local body'], 'mine.txt', { type: 'text/plain' })
  const meta = await booksStore.addLocal(file, 'My Book')
  const session = await openSession(meta)
  expect(session.format).toBe('txt')
  expect(session.title).toBe('My Book')
  expect(session.getPage(0)).toEqual({ type: 'txt', htmlOrText: 'local body' })
  session.destroy()
})

it('throws a clear error for epub until Task 8', async () => {
  await expect(
    openSession({ ...sampleTxt, id: 'sample-epub', format: 'epub', filePath: 'books/sample.epub' }),
  ).rejects.toThrow(/EPUB/)
})

it('throws a clear error for pdf until Task 9', async () => {
  await expect(
    openSession({ ...sampleTxt, id: 'sample-pdf', format: 'pdf', filePath: 'books/sample.pdf' }),
  ).rejects.toThrow(/PDF/)
})

it('throws when sample filePath is missing', async () => {
  await expect(
    openSession({ ...sampleTxt, filePath: undefined }),
  ).rejects.toThrow(/filePath/)
})
