import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { booksStore, clearAllBooksForTests } from '../lib/books/store'
import type { BookMeta } from '../types/book'

const pdfMocks = vi.hoisted(() => {
  const render = vi.fn(() => ({ promise: Promise.resolve() }))
  const getViewport = vi.fn(({ scale }: { scale: number }) => ({
    width: 100 * scale,
    height: 200 * scale,
  }))
  const getPage = vi.fn(async () => ({ getViewport, render }))
  const destroy = vi.fn(async () => {})
  const getDocument = vi.fn(() => ({
    promise: Promise.resolve({ getPage, numPages: 3 }),
    destroy,
  }))
  return { GlobalWorkerOptions: { workerSrc: '' }, getDocument, getPage, getViewport, render, destroy }
})

const epubMocks = vi.hoisted(() => {
  const coverUrl = vi.fn(async () => undefined as string | undefined)
  const load = vi.fn(async () => ({ documentElement: { textContent: '第一章 无人生还' } }))
  const destroy = vi.fn()
  const ePub = vi.fn(() => ({
    ready: Promise.resolve(),
    coverUrl,
    load,
    spine: { get: () => ({ href: 'chapter.xhtml' }) },
    destroy,
  }))
  return { ePub, coverUrl, load, destroy }
})

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: pdfMocks.GlobalWorkerOptions,
  getDocument: pdfMocks.getDocument,
}))

vi.mock('epubjs', () => ({ default: epubMocks.ePub }))

beforeEach(async () => {
  await clearAllBooksForTests()
  vi.clearAllMocks()
  epubMocks.coverUrl.mockResolvedValue(undefined)
  epubMocks.load.mockResolvedValue({ documentElement: { textContent: '第一章 无人生还' } })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,QQ==')
})

describe('coverFromFirstPage', () => {
  it('renders txt first page as an svg data url', async () => {
    const { coverFromFirstPage } = await import('../lib/books/coverFromPage')
    const url = await coverFromFirstPage('txt', new Blob(['论语·学而 子曰：学而时习之'], { type: 'text/plain' }))
    expect(url).toMatch(/^data:image\/svg\+xml/)
    expect(decodeURIComponent(url!)).toContain('论语')
  })

  it('returns undefined for empty txt', async () => {
    const { coverFromFirstPage } = await import('../lib/books/coverFromPage')
    expect(await coverFromFirstPage('txt', new Blob(['   '], { type: 'text/plain' }))).toBeUndefined()
  })

  it('renders pdf page 1 to a jpeg data url', async () => {
    const { coverFromFirstPage } = await import('../lib/books/coverFromPage')
    const url = await coverFromFirstPage('pdf', new Blob(['%PDF'], { type: 'application/pdf' }))
    expect(pdfMocks.getPage).toHaveBeenCalledWith(1)
    expect(url).toBe('data:image/jpeg;base64,QQ==')
    expect(pdfMocks.destroy).toHaveBeenCalled()
  })

  it('uses epub embedded cover when present', async () => {
    const png = new Blob([new Uint8Array([0x89, 0x50])], { type: 'image/png' })
    epubMocks.coverUrl.mockResolvedValue('blob:cover')
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === 'blob:cover') return { ok: true, blob: async () => png }
        throw new Error(`unexpected fetch: ${url}`)
      }),
    )
    const { coverFromFirstPage } = await import('../lib/books/coverFromPage')
    const url = await coverFromFirstPage('epub', new Blob(['PK'], { type: 'application/epub+zip' }))
    expect(url).toMatch(/^data:image\/png/)
    vi.unstubAllGlobals()
  })

  it('falls back to first epub chapter text when there is no cover image', async () => {
    const { coverFromFirstPage } = await import('../lib/books/coverFromPage')
    const url = await coverFromFirstPage('epub', new Blob(['PK'], { type: 'application/epub+zip' }))
    expect(url).toMatch(/^data:image\/svg\+xml/)
    expect(decodeURIComponent(url!)).toContain('无人生还')
  })
})

describe('fillMissingCovers', () => {
  it('generates and persists covers for local books without coverUrl', async () => {
    const meta = await booksStore.addLocal(new File(['学而时习之'], 'analects.txt', { type: 'text/plain' }))
    expect(meta.coverUrl).toBeUndefined()
    const { fillMissingCovers } = await import('../lib/books/coverFromPage')
    const filled = await fillMissingCovers([meta])
    expect(filled[0].coverUrl).toMatch(/^data:image\/svg\+xml/)
    expect((await booksStore.listLocal())[0].coverUrl).toMatch(/^data:image\/svg\+xml/)
  })

  it('leaves existing coverUrl untouched', async () => {
    const book: BookMeta = {
      id: 'x',
      title: 'Has Cover',
      format: 'txt',
      source: 'sample',
      filePath: 'books/x.txt',
      coverUrl: 'https://example/cover.png',
    }
    const { fillMissingCovers } = await import('../lib/books/coverFromPage')
    const filled = await fillMissingCovers([book])
    expect(filled[0].coverUrl).toBe('https://example/cover.png')
  })
})
