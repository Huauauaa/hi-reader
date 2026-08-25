import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ReaderPage } from '../pages/ReaderPage'
import { progressStore, clearAllProgressForTests } from '../lib/progress/store'
import { booksStore, clearAllBooksForTests } from '../lib/books/store'
import type { BookMeta } from '../types/book'
import type { BookSession } from '../lib/readers/types'

const createEpubSession = vi.hoisted(() =>
  vi.fn(async (_blob: Blob, title: string): Promise<BookSession> => ({
    format: 'epub',
    title,
    getToc: () => [{ id: 'n1', label: '第一章', page: 0 }],
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
    attach: vi.fn(),
    display: vi.fn(),
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

const samples: BookMeta[] = [
  { id: 'sample-txt', title: '示例 TXT', format: 'txt', source: 'sample', filePath: 'books/sample.txt' },
  { id: 'sample-pdf', title: '示例 PDF', format: 'pdf', source: 'sample', filePath: 'books/sample.pdf' },
  { id: 'sample-epub', title: '示例 EPUB', format: 'epub', source: 'sample', filePath: 'books/sample.epub' },
]

const TXT = 'A'.repeat(900) + 'SECOND PAGE'

function renderRead(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/read/${id}`]}>
      <Routes>
        <Route path="/read/:id" element={<ReaderPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(async () => {
  await clearAllBooksForTests()
  await clearAllProgressForTests()
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  })
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const u = String(url)
      if (u.endsWith('books.json')) {
        return { ok: true, json: async () => samples }
      }
      if (u.endsWith('books/sample.txt')) {
        return { ok: true, blob: async () => new Blob([TXT], { type: 'text/plain' }) }
      }
      if (u.endsWith('books/sample.epub')) {
        return { ok: true, blob: async () => new Blob(['epub-bytes']) }
      }
      if (u.endsWith('books/sample.pdf')) {
        return { ok: true, blob: async () => new Blob(['pdf-bytes']) }
      }
      return { ok: false, status: 404, blob: async () => new Blob([]) }
    }),
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('ReaderPage', () => {
  it('loads a sample TXT end-to-end', async () => {
    renderRead('sample-txt')
    expect(await screen.findByRole('heading', { name: '示例 TXT' })).toBeInTheDocument()
    expect(screen.getByText(/AAA/)).toBeInTheDocument()
  })

  it('loads a sample PDF end-to-end', async () => {
    renderRead('sample-pdf')
    expect(await screen.findByRole('heading', { name: '示例 PDF' })).toBeInTheDocument()
    expect(document.querySelector('[data-reader-page] canvas')).toBeTruthy()
  })

  it('loads a sample EPUB end-to-end', async () => {
    renderRead('sample-epub')
    expect(await screen.findByRole('heading', { name: '示例 EPUB' })).toBeInTheDocument()
    expect(document.querySelector('[data-reader-page]')).toBeTruthy()
  })

  it('restores saved page on load', async () => {
    await progressStore.save({
      bookId: 'sample-txt',
      page: 1,
      layout: 'single',
      theme: 'light',
      fontScale: 1,
      updatedAt: 1,
    })
    renderRead('sample-txt')
    expect(await screen.findByText(/SECOND PAGE/)).toBeInTheDocument()
    const root = document.querySelector('.reader-root') as HTMLElement
    expect(root).toHaveAttribute('data-theme', 'light')
  })

  it('shows not-found when id is missing from catalog', async () => {
    renderRead('no-such-book')
    expect(await screen.findByRole('status')).toHaveTextContent(/找不到/)
    expect(screen.getByRole('link', { name: '返回书架' })).toHaveAttribute('href', '/')
  })

  it('toasts and links back to shelf when openSession fails', async () => {
    createEpubSession.mockRejectedValueOnce(new Error('corrupt epub'))
    renderRead('sample-epub')
    expect(await screen.findByRole('status')).toHaveTextContent('corrupt epub')
    expect(screen.getByRole('link', { name: '返回书架' })).toHaveAttribute('href', '/')
  })

  it('opens a local book when books.json fetch fails', async () => {
    const file = new File([TXT], 'mine.txt', { type: 'text/plain' })
    const meta = await booksStore.addLocal(file, 'Local Book')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).endsWith('books.json')) throw new Error('network down')
        return { ok: false, status: 404, blob: async () => new Blob([]) }
      }),
    )
    renderRead(meta.id)
    expect(await screen.findByRole('heading', { name: 'Local Book' })).toBeInTheDocument()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
