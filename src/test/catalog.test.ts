import 'fake-indexeddb/auto'
import { it, expect, beforeEach, afterEach, vi } from 'vitest'
import { loadCatalog, filterByTitle } from '../lib/books/catalog'
import { booksStore, clearAllBooksForTests } from '../lib/books/store'
import type { BookMeta } from '../types/book'

const samples: BookMeta[] = [
  { id: 'sample-txt', title: '示例 TXT', format: 'txt', source: 'sample', filePath: 'books/sample.txt' },
  { id: 'sample-pdf', title: '示例 PDF', format: 'pdf', source: 'sample', filePath: 'books/sample.pdf' },
]

beforeEach(async () => {
  await clearAllBooksForTests()
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (String(url).endsWith('books.json')) {
        return { ok: true, json: async () => samples }
      }
      throw new Error(`unexpected fetch: ${url}`)
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

it('filterByTitle matches case-insensitively', () => {
  const books: BookMeta[] = [
    { id: '1', title: 'Hello World', format: 'txt', source: 'local' },
    { id: '2', title: '示例 PDF', format: 'pdf', source: 'sample' },
  ]
  expect(filterByTitle(books, 'pdf')).toHaveLength(1)
  expect(filterByTitle(books, 'hello')).toHaveLength(1)
  expect(filterByTitle(books, '  ')).toHaveLength(2)
})

it('loadCatalog merges samples then local', async () => {
  const file = new File(['x'], 'mine.txt', { type: 'text/plain' })
  await booksStore.addLocal(file, 'My Book')
  const catalog = await loadCatalog()
  expect(catalog).toHaveLength(3)
  expect(catalog[0]).toMatchObject({ id: 'sample-txt', source: 'sample' })
  expect(catalog[1]).toMatchObject({ id: 'sample-pdf', source: 'sample' })
  expect(catalog[2]).toMatchObject({ title: 'My Book', source: 'local' })
})
