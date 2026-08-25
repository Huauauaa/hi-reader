import { render, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PdfView } from '../components/reader/PdfView'
import type { BookSession } from '../lib/readers/types'

afterEach(() => {
  cleanup()
})

function fakePdf(overrides: Partial<BookSession> = {}): BookSession {
  const canvases = [
    document.createElement('canvas'),
    document.createElement('canvas'),
  ]
  canvases[0].dataset.page = '0'
  canvases[1].dataset.page = '1'
  return {
    format: 'pdf',
    title: '示例 PDF',
    getToc: () => [{ id: 'p0', label: '第 1 页', page: 0 }],
    getPageCount: () => 2,
    getPage: (n) => ({
      type: 'pdf',
      canvas: canvases[Math.max(0, Math.min(n, 1))],
    }),
    goToPage: () => {},
    next: () => {},
    prev: () => {},
    getCurrentPage: () => 0,
    setLayout: () => {},
    getLayout: () => 'single',
    setFontScale: () => {},
    getFontScale: () => 1,
    destroy: () => {},
    ...overrides,
  }
}

describe('PdfView', () => {
  it('mounts the current page canvas', () => {
    const session = fakePdf()
    render(<PdfView session={session} layout="single" />)
    const hosts = document.querySelectorAll('[data-reader-page]')
    expect(hosts).toHaveLength(1)
    expect(hosts[0].querySelector('canvas')).toBe(
      (session.getPage(0) as { canvas: HTMLCanvasElement }).canvas,
    )
  })

  it('shows two canvases side by side in double layout', () => {
    const session = fakePdf()
    render(<PdfView session={session} layout="double" />)
    const hosts = document.querySelectorAll('[data-reader-page]')
    expect(hosts).toHaveLength(2)
    expect(hosts[0].querySelector('canvas')).toBe(
      (session.getPage(0) as { canvas: HTMLCanvasElement }).canvas,
    )
    expect(hosts[1].querySelector('canvas')).toBe(
      (session.getPage(1) as { canvas: HTMLCanvasElement }).canvas,
    )
  })

  it('keeps a single canvas when double layout has no next page', () => {
    const session = fakePdf({ getPageCount: () => 1, getCurrentPage: () => 0 })
    render(<PdfView session={session} layout="double" />)
    expect(document.querySelectorAll('[data-reader-page]')).toHaveLength(1)
  })
})
