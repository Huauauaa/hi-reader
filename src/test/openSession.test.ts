import 'fake-indexeddb/auto'
import { it, expect, beforeEach, afterEach, vi } from 'vitest'
import { openSession } from '../lib/readers/openSession'
import { booksStore, clearAllBooksForTests } from '../lib/books/store'
import type { BookMeta } from '../types/book'
import type { BookSession } from '../lib/readers/types'

const createEpubSession = vi.hoisted(() =>
  vi.fn(async (_blob: Blob, title: string): Promise<BookSession> => ({
    format: 'epub',
    title,
    getToc: () => [],
    getPageCount: () => 1,
    getPage: () => ({ type: 'epub', container: document.createElement('div') }),
    goToPage: () => {},
    next: () => {},
    prev: () => {},
    getCurrentPage: () => 0,
    setLayout: () => {},
    getLayout: () => 'single',
    setFontScale: () => {},
    getFontScale: () => 1,
    destroy: () => {},
  })),
)

const createPdfSession = vi.hoisted(() =>
  vi.fn(async (_blob: Blob, title: string): Promise<BookSession> => ({
    format: 'pdf',
    title,
    getToc: () => [{ id: 'p0', label: '第 1 页', page: 0 }],
    getPageCount: () => 1,
    getPage: () => ({ type: 'pdf', canvas: document.createElement('canvas') }),
    goToPage: () => {},
    next: () => {},
    prev: () => {},
    getCurrentPage: () => 0,
    setLayout: () => {},
    getLayout: () => 'single',
    setFontScale: () => {},
    getFontScale: () => 1,
    destroy: () => {},
  })),
)

vi.mock('../lib/readers/epubSession', () => ({ createEpubSession }))
vi.mock('../lib/readers/pdfSession', () => ({ createPdfSession }))

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
        return {
          ok: true,
          blob: async () =>
            new Blob(['hello from sample'], { type: 'text/plain' }),
        }
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
  expect(session.getPage(0)).toEqual({
    type: 'txt',
    htmlOrText: 'hello from sample',
  })
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

it('opens a sample epub via createEpubSession', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (String(url).endsWith('books/sample.epub')) {
        return { ok: true, blob: async () => new Blob(['epub-bytes']) }
      }
      return { ok: false, status: 404, blob: async () => new Blob([]) }
    }),
  )
  const session = await openSession({
    ...sampleTxt,
    id: 'sample-epub',
    title: '示例 EPUB',
    format: 'epub',
    filePath: 'books/sample.epub',
  })
  expect(session.format).toBe('epub')
  expect(session.title).toBe('示例 EPUB')
  expect(createEpubSession).toHaveBeenCalled()
  session.destroy()
})

it('opens a sample pdf via createPdfSession', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (String(url).endsWith('books/sample.pdf')) {
        return { ok: true, blob: async () => new Blob(['pdf-bytes']) }
      }
      return { ok: false, status: 404, blob: async () => new Blob([]) }
    }),
  )
  const session = await openSession({
    ...sampleTxt,
    id: 'sample-pdf',
    title: '示例 PDF',
    format: 'pdf',
    filePath: 'books/sample.pdf',
  })
  expect(session.format).toBe('pdf')
  expect(session.title).toBe('示例 PDF')
  expect(createPdfSession).toHaveBeenCalled()
  session.destroy()
})

it('throws when sample filePath is missing', async () => {
  await expect(
    openSession({ ...sampleTxt, filePath: undefined }),
  ).rejects.toThrow(/filePath/)
})
