import type { BookFormat } from '../../types/book'

export type TocItem = { id: string; label: string; page: number }

export type PageContent =
  | { type: 'txt'; htmlOrText: string }
  | { type: 'pdf'; canvas: HTMLCanvasElement }
  | { type: 'epub'; container: HTMLElement }

export type BookSession = {
  format: BookFormat
  title: string
  getToc(): TocItem[]
  getPageCount(): number
  getPage(n: number): PageContent
  goToPage(n: number): void
  next(): void
  prev(): void
  getCurrentPage(): number
  setLayout(layout: 'single' | 'double'): void
  getLayout(): 'single' | 'double'
  setFontScale(n: number): void
  getFontScale(): number
  destroy(): void
  attach?(el: HTMLElement, layout?: 'single' | 'double'): void
  display?(page: number): void
  onSelected?(cb: (sel: { cfi: string; quote: string }) => void): () => void
  applyHighlights?(items: { cfi: string; color: string }[]): void
  displayCfi?(cfi: string): void
}
