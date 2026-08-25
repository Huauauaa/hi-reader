import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ReaderPage } from '../pages/ReaderPage'
import { progressStore, clearAllProgressForTests } from '../lib/progress/store'
import { clearAllBooksForTests } from '../lib/books/store'
import type { BookMeta } from '../types/book'

const samples: BookMeta[] = [
  { id: 'sample-txt', title: '示例 TXT', format: 'txt', source: 'sample', filePath: 'books/sample.txt' },
  { id: 'sample-pdf', title: '示例 PDF', format: 'pdf', source: 'sample', filePath: 'books/sample.pdf' },
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

  it('shows a stub error for PDF', async () => {
    renderRead('sample-pdf')
    expect(await screen.findByText(/PDF/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回书架' })).toHaveAttribute('href', '/')
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
    expect(await screen.findByText(/找不到/)).toBeInTheDocument()
  })
})
