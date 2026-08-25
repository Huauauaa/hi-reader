import { render, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EpubView } from '../components/reader/EpubView'
import type { BookSession } from '../lib/readers/types'

afterEach(() => {
  cleanup()
})

function fakeEpub(overrides: Partial<BookSession> = {}): BookSession {
  return {
    format: 'epub',
    title: '示例 EPUB',
    getToc: () => [{ id: 'n1', label: '第一章', page: 0 }],
    getPageCount: () => 2,
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
    ...overrides,
  }
}

describe('EpubView', () => {
  it('attaches the session to a host element and displays the current page', () => {
    const session = fakeEpub()
    render(<EpubView session={session} layout="single" />)
    expect(session.attach).toHaveBeenCalled()
    const el = (session.attach as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(el).toBeInstanceOf(HTMLElement)
    expect((session.attach as ReturnType<typeof vi.fn>).mock.calls[0][1]).toBe('single')
    expect(session.display).toHaveBeenCalledWith(0)
  })

  it('passes double layout through to attach', () => {
    const session = fakeEpub()
    render(<EpubView session={session} layout="double" />)
    expect((session.attach as ReturnType<typeof vi.fn>).mock.calls[0][1]).toBe('double')
  })

  it('re-attaches when theme changes', () => {
    const session = fakeEpub()
    const { rerender } = render(<EpubView session={session} layout="single" theme="dark" />)
    const n = (session.attach as ReturnType<typeof vi.fn>).mock.calls.length
    rerender(<EpubView session={session} layout="single" theme="light" />)
    expect((session.attach as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(n)
  })
})
