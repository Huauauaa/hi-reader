import * as pdfjs from 'pdfjs-dist'
import type { BookSession, PageContent, TocItem } from './types'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

type PdfDoc = Awaited<ReturnType<typeof pdfjs.getDocument>['promise']>
type OutlineNode = {
  title: string
  dest: string | unknown[] | null
  items: OutlineNode[]
}

function pageListToc(numPages: number): TocItem[] {
  return Array.from({ length: Math.max(1, numPages) }, (_, i) => ({
    id: `p${i}`,
    label: `第 ${i + 1} 页`,
    page: i,
  }))
}

async function pageForDest(
  pdf: PdfDoc,
  dest: OutlineNode['dest'],
): Promise<number> {
  let explicit: unknown = dest
  if (typeof dest === 'string') explicit = await pdf.getDestination(dest)
  if (
    !Array.isArray(explicit) ||
    !explicit[0] ||
    typeof explicit[0] !== 'object'
  )
    return 0
  try {
    return await pdf.getPageIndex(explicit[0] as { num: number; gen: number })
  } catch {
    return 0
  }
}

async function flattenOutline(
  pdf: PdfDoc,
  items: OutlineNode[],
): Promise<TocItem[]> {
  const out: TocItem[] = []
  async function walk(list: OutlineNode[]) {
    for (const item of list) {
      out.push({
        id: item.title,
        label: item.title.trim() || 'untitled',
        page: await pageForDest(pdf, item.dest),
      })
      if (item.items?.length) await walk(item.items)
    }
  }
  await walk(items)
  return out
}

export async function createPdfSession(
  blob: Blob,
  title: string,
): Promise<BookSession> {
  const loadingTask = pdfjs.getDocument({ data: await blob.arrayBuffer() })
  const pdf = await loadingTask.promise
  const last = Math.max(0, pdf.numPages - 1)
  const outline = (await pdf.getOutline()) as OutlineNode[] | null
  const toc = outline?.length
    ? await flattenOutline(pdf, outline)
    : pageListToc(pdf.numPages)

  let layout: 'single' | 'double' = 'single'
  let fontScale = 1
  let currentPage = 0
  let closed = false
  const canvases = new Map<number, HTMLCanvasElement>()
  const paints = new Map<number, { scale: number; cancel: () => void }>()

  function clamp(n: number): number {
    return Math.max(0, Math.min(n, last))
  }

  async function paint(idx: number, canvas: HTMLCanvasElement, scale: number) {
    paints.get(idx)?.cancel()
    let cancelled = false
    const entry = {
      scale,
      cancel: () => {
        cancelled = true
      },
    }
    paints.set(idx, entry)
    const page = await pdf.getPage(idx + 1)
    if (closed || cancelled) return
    const viewport = page.getViewport({ scale })
    canvas.width = viewport.width
    canvas.height = viewport.height
    const task = page.render({ canvas, viewport })
    entry.cancel = () => {
      cancelled = true
      task.cancel()
    }
    try {
      await task.promise
    } catch {
      // ponytail: swallow RenderingCancelledException; rethrow if paint errors surface in UI
    }
  }

  function getPage(n: number): PageContent {
    const idx = clamp(n)
    let canvas = canvases.get(idx)
    if (!canvas) {
      canvas = document.createElement('canvas')
      canvases.set(idx, canvas)
    }
    const current = paints.get(idx)
    if (!current || current.scale !== fontScale)
      void paint(idx, canvas, fontScale)
    return { type: 'pdf', canvas }
  }

  return {
    format: 'pdf',
    title,

    getToc(): TocItem[] {
      return toc
    },

    getPageCount(): number {
      return Math.max(1, pdf.numPages)
    },

    getPage,

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
      layout = next
    },

    getLayout(): 'single' | 'double' {
      return layout
    },

    setFontScale(n: number): void {
      fontScale = n
    },

    getFontScale(): number {
      return fontScale
    },

    destroy(): void {
      closed = true
      for (const p of paints.values()) p.cancel()
      paints.clear()
      canvases.clear()
      void loadingTask.destroy()
    },
  }
}
