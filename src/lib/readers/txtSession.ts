import { paginateTxt } from '../pagination/txtPages'
import type { BookSession, PageContent, TocItem } from './types'

const BASE_CHARS_SINGLE = 900
const BASE_CHARS_DOUBLE = 450

function charsPerPage(layout: 'single' | 'double', fontScale: number): number {
  const base = layout === 'single' ? BASE_CHARS_SINGLE : BASE_CHARS_DOUBLE
  return Math.max(1, Math.round(base * fontScale))
}

export function createTxtSession(text: string, title: string): BookSession {
  let layout: 'single' | 'double' = 'single'
  let fontScale = 1
  let pages = paginateTxt(text, { charsPerPage: charsPerPage(layout, fontScale) })
  let currentPage = 0

  function repaginate() {
    const charOffset = pages.slice(0, currentPage).join('').length
    pages = paginateTxt(text, { charsPerPage: charsPerPage(layout, fontScale) })
    currentPage =
      pages.length === 0
        ? 0
        : Math.min(
            pages.length - 1,
            Math.floor(charOffset / charsPerPage(layout, fontScale)),
          )
  }

  return {
    format: 'txt',
    title,

    getToc(): TocItem[] {
      return [{ id: 'body', label: '正文', page: 0 }]
    },

    getPageCount(): number {
      return pages.length
    },

    getPage(n: number): PageContent {
      const idx = Math.max(0, Math.min(n, pages.length - 1))
      return { type: 'txt', htmlOrText: pages[idx] ?? '' }
    },

    goToPage(n: number): void {
      currentPage = Math.max(0, Math.min(n, pages.length - 1))
    },

    next(): void {
      if (currentPage < pages.length - 1) currentPage += 1
    },

    prev(): void {
      if (currentPage > 0) currentPage -= 1
    },

    getCurrentPage(): number {
      return currentPage
    },

    setLayout(next: 'single' | 'double'): void {
      if (layout === next) return
      layout = next
      repaginate()
    },

    getLayout(): 'single' | 'double' {
      return layout
    },

    setFontScale(n: number): void {
      if (fontScale === n) return
      fontScale = n
      repaginate()
    },

    getFontScale(): number {
      return fontScale
    },

    destroy(): void {
      pages = []
      currentPage = 0
    },
  }
}
