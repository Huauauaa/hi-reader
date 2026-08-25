import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ReaderShell } from '../components/reader/ReaderShell'
import { createTxtSession } from '../lib/readers/txtSession'
import { progressStore, clearAllProgressForTests } from '../lib/progress/store'
import type { BookSession } from '../lib/readers/types'

function longBook() {
  return 'A'.repeat(900) + 'B'.repeat(900) + 'C'.repeat(100)
}

function renderShell(session: BookSession, bookId = 't1') {
  return render(
    <MemoryRouter>
      <ReaderShell session={session} bookId={bookId} initialTheme="dark" />
    </MemoryRouter>,
  )
}

beforeEach(async () => {
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
})

afterEach(() => {
  cleanup()
})

describe('ReaderShell', () => {
  it('renders title, header links, and first page text', () => {
    const session = createTxtSession(longBook(), 'Test Book')
    renderShell(session)
    expect(screen.getByRole('heading', { name: 'Test Book' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '首页' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: '我的书架' })).toHaveAttribute('href', '/')
    expect(screen.getByText(/AAA/)).toBeInTheDocument()
    expect(screen.queryByText(/BBB/)).not.toBeInTheDocument()
  })

  it('flips pages with footer buttons and arrow keys', () => {
    const session = createTxtSession(longBook(), 'Test Book')
    renderShell(session)
    fireEvent.click(screen.getByRole('button', { name: '下一页' }))
    expect(screen.getByText(/BBB/)).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText(/CCC/)).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText(/BBB/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '上一页' }))
    expect(screen.getByText(/AAA/)).toBeInTheDocument()
  })

  it('opens TOC panel, jumps, and closes on Escape', () => {
    const session = createTxtSession(longBook(), 'Test Book')
    session.goToPage(1)
    renderShell(session)
    fireEvent.click(screen.getByRole('button', { name: '目录' }))
    fireEvent.click(screen.getByRole('button', { name: '正文' }))
    expect(screen.getByText(/AAA/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '目录' }))
    expect(screen.getByRole('button', { name: '正文' })).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('button', { name: '正文' })).not.toBeInTheDocument()
  })

  it('applies theme CSS variables on .reader-root', () => {
    const session = createTxtSession(longBook(), 'Test Book')
    renderShell(session)
    const root = document.querySelector('.reader-root') as HTMLElement
    expect(root).toHaveAttribute('data-theme', 'dark')
    fireEvent.click(screen.getByRole('button', { name: '主题' }))
    fireEvent.click(screen.getByRole('button', { name: '浅色' }))
    expect(root).toHaveAttribute('data-theme', 'light')
    fireEvent.click(screen.getByRole('button', { name: '羊皮纸' }))
    expect(root).toHaveAttribute('data-theme', 'sepia')
  })

  it('toggles double layout and changes font scale', () => {
    const session = createTxtSession(longBook(), 'Test Book')
    renderShell(session)
    fireEvent.click(screen.getByRole('button', { name: '布局' }))
    expect(session.getLayout()).toBe('double')
    expect(document.querySelectorAll('[data-reader-page]')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: '字号' }))
    fireEvent.click(screen.getByRole('button', { name: '增大字号' }))
    expect(session.getFontScale()).toBeGreaterThan(1)
  })

  it('toasts 即将推出 for 批注 and 笔记', () => {
    const session = createTxtSession(longBook(), 'Test Book')
    renderShell(session)
    fireEvent.click(screen.getByRole('button', { name: '批注' }))
    expect(screen.getByRole('status')).toHaveTextContent('即将推出')
    fireEvent.click(screen.getByRole('button', { name: '笔记' }))
    expect(screen.getByRole('status')).toHaveTextContent('即将推出')
  })

  it('debounces progress save on page change', async () => {
    const session = createTxtSession(longBook(), 'Test Book')
    renderShell(session, 't1')
    fireEvent.click(screen.getByRole('button', { name: '下一页' }))
    await waitFor(async () => {
      const p = await progressStore.get('t1')
      expect(p?.page).toBe(1)
    })
  })
})
