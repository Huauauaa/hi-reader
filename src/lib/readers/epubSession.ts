import ePubMod from 'epubjs'
import type { Book, NavItem, Rendition } from 'epubjs'
import type { BookSession, PageContent, TocItem } from './types'

type SpineItem = { href: string; linear?: boolean | string; index: number }

function openBook(data: ArrayBuffer): Book {
  const ePub =
    typeof ePubMod === 'function'
      ? ePubMod
      : (ePubMod as unknown as { default: (data: ArrayBuffer) => Book }).default
  return ePub(data)
}

function spreadMode(layout: 'single' | 'double'): 'none' | 'always' {
  return layout === 'double' ? 'always' : 'none'
}

function linearSpine(book: Book): SpineItem[] {
  const items: SpineItem[] = []
  book.spine.each((item: SpineItem) => {
    if (item.linear === false || item.linear === 'no') return
    items.push(item)
  })
  return items
}

function pageForHref(spine: SpineItem[], href: string): number {
  const path = href.split('#')[0]
  const fromSpine = bookGet(spine, path)
  if (fromSpine >= 0) return fromSpine
  return 0
}

function bookGet(spine: SpineItem[], path: string): number {
  return spine.findIndex(
    (s) => s.href === path || s.href.endsWith(path) || path.endsWith(s.href),
  )
}

function flattenToc(items: NavItem[] | undefined, spine: SpineItem[]): TocItem[] {
  const out: TocItem[] = []
  function walk(list: NavItem[]) {
    for (const item of list) {
      out.push({
        id: item.id || item.href,
        label: (item.label || item.href).trim(),
        page: pageForHref(spine, item.href),
      })
      if (item.subitems?.length) walk(item.subitems)
    }
  }
  if (items?.length) walk(items)
  if (out.length === 0) {
    return spine.map((s, i) => ({ id: s.href, label: s.href, page: i }))
  }
  return out
}

function applyChrome(rendition: Rendition, host: HTMLElement | null, fontScale: number) {
  const root = host?.closest('.reader-root') as HTMLElement | null
  const style = root ? getComputedStyle(root) : null
  const bg = style?.getPropertyValue('--page-bg').trim() || '#2a2a2a'
  const ink = style?.getPropertyValue('--page-ink').trim() || '#e8e8e8'
  const size = `${Math.round(fontScale * 100)}%`
  rendition.themes.fontSize(size)
  rendition.themes.override('background', bg, true)
  rendition.themes.override('color', ink, true)
  const body = host?.querySelector('iframe')?.contentDocument?.body
  if (body) {
    body.style.background = bg
    body.style.color = ink
    body.style.fontSize = size
  }
}

export async function createEpubSession(blob: Blob, title: string): Promise<BookSession> {
  const book = openBook(await blob.arrayBuffer())
  await book.ready

  // ponytail: linear spine items as pages; epubjs locations if per-screen paging is needed
  const spine = linearSpine(book)
  const toc = flattenToc(book.navigation?.toc, spine)
  const last = Math.max(0, spine.length - 1)

  let layout: 'single' | 'double' = 'single'
  let fontScale = 1
  let currentPage = 0
  let host: HTMLElement | null = null
  let rendition: Rendition | null = null
  let selectedCb: ((sel: { cfi: string; quote: string }) => void) | null = null
  let applied: string[] = []

  function bindSelected(r: Rendition) {
    r.on('selected', (cfi: string, contents: { range: (c: string) => Range }) => {
      let quote = ''
      try {
        quote = contents.range(cfi)?.toString() ?? ''
      } catch {
        quote = ''
      }
      selectedCb?.({ cfi, quote: quote || cfi })
    })
  }

  function hrefFor(page: number): string {
    return spine[Math.max(0, Math.min(page, last))]?.href ?? ''
  }

  function clamp(n: number): number {
    return Math.max(0, Math.min(n, last))
  }

  const session: BookSession = {
    format: 'epub',
    title,

    getToc(): TocItem[] {
      return toc
    },

    getPageCount(): number {
      return Math.max(1, spine.length)
    },

    getPage(_n: number): PageContent {
      return { type: 'epub', container: host ?? document.createElement('div') }
    },

    goToPage(n: number): void {
      currentPage = clamp(n)
    },

    next(): void {
      currentPage = clamp(currentPage + 1)
    },

    prev(): void {
      currentPage = clamp(currentPage - 1)
    },

    getCurrentPage(): number {
      return currentPage
    },

    setLayout(next: 'single' | 'double'): void {
      if (layout === next) return
      layout = next
      rendition?.spread(spreadMode(layout))
    },

    getLayout(): 'single' | 'double' {
      return layout
    },

    setFontScale(n: number): void {
      if (fontScale === n) return
      fontScale = n
      if (rendition) applyChrome(rendition, host, fontScale)
    },

    getFontScale(): number {
      return fontScale
    },

    attach(el: HTMLElement, visual?: 'single' | 'double'): void {
      const spread = spreadMode(visual ?? layout)
      if (rendition && host === el) {
        rendition.spread(spread)
        applyChrome(rendition, host, fontScale)
        return
      }
      rendition?.destroy()
      applied = []
      host = el
      rendition = book.renderTo(el, {
        width: '100%',
        height: '100%',
        flow: 'paginated',
        spread,
        allowScriptedContent: false,
      })
      bindSelected(rendition)
      applyChrome(rendition, host, fontScale)
      void Promise.resolve(rendition.display(hrefFor(currentPage))).then(() => {
        if (rendition) applyChrome(rendition, host, fontScale)
      })
    },

    display(page: number): void {
      currentPage = clamp(page)
      if (!rendition) return
      void Promise.resolve(rendition.display(hrefFor(currentPage))).then(() => {
        if (rendition) applyChrome(rendition, host, fontScale)
      })
    },

    onSelected(cb: (sel: { cfi: string; quote: string }) => void): () => void {
      selectedCb = cb
      return () => {
        if (selectedCb === cb) selectedCb = null
      }
    },

    applyHighlights(items: { cfi: string; color: string }[]): void {
      if (!rendition) return
      for (const cfi of applied) {
        try {
          rendition.annotations.remove(cfi, 'highlight')
        } catch {
          /* ponytail: epubjs throws if the CFI section is not on screen */
        }
      }
      applied = []
      for (const it of items) {
        rendition.annotations.highlight(it.cfi, {}, undefined, 'hi-hl', {
          fill: it.color,
          'fill-opacity': '0.4',
        })
        applied.push(it.cfi)
      }
    },

    displayCfi(cfi: string): void {
      const item = book.spine.get(cfi) as SpineItem | undefined
      if (item) {
        const idx = spine.findIndex((s) => s.href === item.href || s.index === item.index)
        if (idx >= 0) currentPage = idx
      }
      if (!rendition) return
      void Promise.resolve(rendition.display(cfi)).then(() => {
        if (rendition) applyChrome(rendition, host, fontScale)
      })
    },

    destroy(): void {
      rendition?.destroy()
      rendition = null
      host = null
      selectedCb = null
      applied = []
      book.destroy()
    },
  }

  return session
}
