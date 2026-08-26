import 'fake-indexeddb/auto'
import { it, expect, beforeEach, afterEach, vi } from 'vitest'
import { loadCatalog, filterByTitle } from '../lib/books/catalog'
import { booksStore, clearAllBooksForTests } from '../lib/books/store'
import type { BookMeta } from '../types/book'

vi.mock('../lib/books/samples', () => ({
  listSampleBooks: () =>
    [
      {
        id: 'sample-txt',
        title: '示例 TXT',
        format: 'txt',
        source: 'sample',
        filePath: '/mock/sample.txt',
      },
      {
        id: 'sample-pdf',
        title: '示例 PDF',
        format: 'pdf',
        source: 'sample',
        filePath: '/mock/sample.pdf',
      },
    ] satisfies BookMeta[],
}))

beforeEach(async () => {
  await clearAllBooksForTests()
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

it('loadCatalog still returns samples when no local books', async () => {
  const catalog = await loadCatalog()
  expect(catalog.map((b) => b.id)).toEqual(['sample-txt', 'sample-pdf'])
})

it('skips broken local cards and warns', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(booksStore, 'listLocal').mockResolvedValueOnce([
    {
      id: 'ok',
      title: 'Good',
      format: 'txt',
      source: 'local',
    },
    { id: 'empty-title', title: '', format: 'txt', source: 'local' },
    {
      id: 'bad-fmt',
      title: 'Doc',
      format: 'docx' as BookMeta['format'],
      source: 'local',
    },
  ] as BookMeta[])
  const catalog = await loadCatalog()
  expect(catalog.map((b) => b.id)).toEqual(['sample-txt', 'sample-pdf', 'ok'])
  expect(warn).toHaveBeenCalled()
  warn.mockRestore()
})
