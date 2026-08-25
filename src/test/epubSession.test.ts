import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEpubSession } from '../lib/readers/epubSession'

const mocks = vi.hoisted(() => {
  const display = vi.fn(async () => {})
  const spread = vi.fn()
  const fontSize = vi.fn()
  const override = vi.fn()
  const destroyRendition = vi.fn()
  const destroyBook = vi.fn()
  const on = vi.fn()
  const highlight = vi.fn()
  const remove = vi.fn()
  const renderTo = vi.fn(() => ({
    display,
    spread,
    themes: { fontSize, override, default: vi.fn() },
    destroy: destroyRendition,
    on,
    off: vi.fn(),
    annotations: { highlight, remove },
  }))
  const ch1 = { href: 'ch1.xhtml', linear: true, index: 0 }
  const ch2 = { href: 'ch2.xhtml', linear: true, index: 1 }
  const spineItems = [ch1, ch2]
  const book = {
    ready: Promise.resolve(),
    loaded: { navigation: Promise.resolve() },
    navigation: {
      toc: [
        { id: 'n1', href: 'ch1.xhtml', label: '第一章', subitems: [] },
        {
          id: 'n2',
          href: 'ch2.xhtml',
          label: '第二章',
          subitems: [{ id: 'n2a', href: 'ch2.xhtml#s', label: '小节', subitems: [] }],
        },
      ],
    },
    spine: {
      each: (fn: (s: typeof ch1) => void) => spineItems.forEach(fn),
      get: (t: string | number) => {
        if (typeof t === 'number') return spineItems[t]
        const href = String(t).split('#')[0]
        return spineItems.find((s) => s.href === href)
      },
    },
    renderTo,
    destroy: destroyBook,
  }
  return {
    ePub: vi.fn(() => book),
    display,
    spread,
    fontSize,
    override,
    destroyRendition,
    destroyBook,
    renderTo,
    on,
    highlight,
    remove,
  }
})

vi.mock('epubjs', () => ({ default: mocks.ePub }))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createEpubSession', () => {
  it('exposes format, title, spine page count, and flattened TOC', async () => {
    const session = await createEpubSession(new Blob(['x']), '示例 EPUB')
    expect(session.format).toBe('epub')
    expect(session.title).toBe('示例 EPUB')
    expect(session.getPageCount()).toBe(2)
    expect(session.getToc()).toEqual([
      { id: 'n1', label: '第一章', page: 0 },
      { id: 'n2', label: '第二章', page: 1 },
      { id: 'n2a', label: '小节', page: 1 },
    ])
    expect(session.getPage(0).type).toBe('epub')
    session.destroy()
  })

  it('navigates and clamps to spine pages', async () => {
    const session = await createEpubSession(new Blob(['x']), 'Book')
    session.goToPage(1)
    expect(session.getCurrentPage()).toBe(1)
    session.next()
    expect(session.getCurrentPage()).toBe(1)
    session.prev()
    expect(session.getCurrentPage()).toBe(0)
    session.prev()
    expect(session.getCurrentPage()).toBe(0)
    session.goToPage(99)
    expect(session.getCurrentPage()).toBe(1)
    session.destroy()
  })

  it('stores layout and fontScale', async () => {
    const session = await createEpubSession(new Blob(['x']), 'Book')
    session.setLayout('double')
    session.setFontScale(1.2)
    expect(session.getLayout()).toBe('double')
    expect(session.getFontScale()).toBe(1.2)
    session.destroy()
  })

  it('attach renders into the host and display shows the spine href', async () => {
    const session = await createEpubSession(new Blob(['x']), 'Book')
    const host = document.createElement('div')
    session.attach?.(host, 'single')
    expect(mocks.renderTo).toHaveBeenCalledWith(
      host,
      expect.objectContaining({ spread: 'none' }),
    )
    expect(mocks.display).toHaveBeenCalledWith('ch1.xhtml')
    session.goToPage(1)
    session.display?.(1)
    expect(mocks.display).toHaveBeenCalledWith('ch2.xhtml')
    session.destroy()
  })

  it('applies fontSize and spread after attach', async () => {
    const session = await createEpubSession(new Blob(['x']), 'Book')
    session.attach?.(document.createElement('div'), 'single')
    session.setFontScale(1.5)
    expect(mocks.fontSize).toHaveBeenCalledWith('150%')
    session.setLayout('double')
    expect(mocks.spread).toHaveBeenCalledWith('always')
    session.destroy()
  })

  it('destroy tears down rendition and book', async () => {
    const session = await createEpubSession(new Blob(['x']), 'Book')
    session.attach?.(document.createElement('div'))
    session.destroy()
    expect(mocks.destroyRendition).toHaveBeenCalled()
    expect(mocks.destroyBook).toHaveBeenCalled()
  })

  it('forwards selected CFI and applies highlights', async () => {
    const session = await createEpubSession(new Blob(['x']), 'Book')
    session.attach?.(document.createElement('div'))
    const cb = vi.fn()
    session.onSelected?.(cb)
    expect(mocks.on).toHaveBeenCalledWith('selected', expect.any(Function))
    const handler = mocks.on.mock.calls.find((c) => c[0] === 'selected')?.[1] as (
      cfi: string,
      contents: { range: (c: string) => { toString: () => string } },
    ) => void
    handler('epubcfi(x)', { range: () => ({ toString: () => 'hi' }) })
    expect(cb).toHaveBeenCalledWith({ cfi: 'epubcfi(x)', quote: 'hi' })
    session.applyHighlights?.([{ cfi: 'epubcfi(x)', color: '#f7e08a' }])
    expect(mocks.highlight).toHaveBeenCalled()
    session.displayCfi?.('epubcfi(x)')
    expect(mocks.display).toHaveBeenCalledWith('epubcfi(x)')
    session.destroy()
  })
})
