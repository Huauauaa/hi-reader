import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPdfSession } from '../lib/readers/pdfSession'

const mocks = vi.hoisted(() => {
  const cancel = vi.fn()
  const getViewport = vi.fn(({ scale }: { scale: number }) => ({
    width: 100 * scale,
    height: 200 * scale,
  }))
  const render = vi.fn(() => ({ promise: Promise.resolve(), cancel }))
  const getPage = vi.fn(async () => ({ getViewport, render }))
  const getOutline = vi.fn(async () => [
    { title: '封面', dest: 'cover', items: [] },
    {
      title: '正文',
      dest: [{ num: 2 }],
      items: [{ title: '小节', dest: [{ num: 2 }], items: [] }],
    },
  ])
  const getDestination = vi.fn(async (name: string) =>
    name === 'cover' ? [{ num: 1 }] : [{ num: 1 }],
  )
  const getPageIndex = vi.fn(async (ref: { num: number }) => ref.num - 1)
  const destroyPdf = vi.fn(async () => {})
  const pdf = {
    numPages: 2,
    getPage,
    getOutline,
    getDestination,
    getPageIndex,
    destroy: destroyPdf,
  }
  const GlobalWorkerOptions = { workerSrc: '' }
  const getDocument = vi.fn(() => ({
    promise: Promise.resolve(pdf),
    destroy: destroyPdf,
  }))
  return {
    GlobalWorkerOptions,
    getDocument,
    getPage,
    getViewport,
    render,
    getOutline,
    getDestination,
    getPageIndex,
    destroyPdf,
    cancel,
    pdf,
  }
})

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: mocks.GlobalWorkerOptions,
  getDocument: mocks.getDocument,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.pdf.numPages = 2
  mocks.getOutline.mockResolvedValue([
    { title: '封面', dest: 'cover', items: [] },
    {
      title: '正文',
      dest: [{ num: 2 }],
      items: [{ title: '小节', dest: [{ num: 2 }], items: [] }],
    },
  ])
})

describe('createPdfSession', () => {
  it('configures the pdfjs worker from import.meta.url', async () => {
    await createPdfSession(new Blob(['x']), '示例 PDF')
    expect(mocks.GlobalWorkerOptions.workerSrc).toMatch(/pdf\.worker/)
  })

  it('exposes format, title, page count, and flattened outline TOC', async () => {
    const session = await createPdfSession(new Blob(['x']), '示例 PDF')
    expect(session.format).toBe('pdf')
    expect(session.title).toBe('示例 PDF')
    expect(session.getPageCount()).toBe(2)
    expect(session.getToc()).toEqual([
      { id: '封面', label: '封面', page: 0 },
      { id: '正文', label: '正文', page: 1 },
      { id: '小节', label: '小节', page: 1 },
    ])
    session.destroy()
  })

  it('falls back to 第 i 页 when the PDF has no outline', async () => {
    mocks.getOutline.mockResolvedValue([])
    const session = await createPdfSession(new Blob(['x']), 'Book')
    expect(session.getToc()).toEqual([
      { id: 'p0', label: '第 1 页', page: 0 },
      { id: 'p1', label: '第 2 页', page: 1 },
    ])
    session.destroy()
  })

  it('navigates and clamps to page range', async () => {
    const session = await createPdfSession(new Blob(['x']), 'Book')
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
    const session = await createPdfSession(new Blob(['x']), 'Book')
    session.setLayout('double')
    session.setFontScale(1.2)
    expect(session.getLayout()).toBe('double')
    expect(session.getFontScale()).toBe(1.2)
    session.destroy()
  })

  it('getPage returns a canvas rendered at fontScale zoom', async () => {
    const session = await createPdfSession(new Blob(['x']), 'Book')
    const page = session.getPage(0)
    expect(page.type).toBe('pdf')
    if (page.type !== 'pdf') return
    expect(page.canvas).toBeInstanceOf(HTMLCanvasElement)
    await vi.waitFor(() => expect(mocks.getPage).toHaveBeenCalledWith(1))
    expect(mocks.getViewport).toHaveBeenCalledWith({ scale: 1 })
    session.setFontScale(1.5)
    session.getPage(0)
    await vi.waitFor(() =>
      expect(mocks.getViewport).toHaveBeenCalledWith({ scale: 1.5 }),
    )
    session.destroy()
  })

  it('destroy cancels in-flight renders and tears down the document', async () => {
    const session = await createPdfSession(new Blob(['x']), 'Book')
    session.getPage(0)
    await vi.waitFor(() => expect(mocks.render).toHaveBeenCalled())
    session.destroy()
    expect(mocks.cancel).toHaveBeenCalled()
    expect(mocks.destroyPdf).toHaveBeenCalled()
  })
})
