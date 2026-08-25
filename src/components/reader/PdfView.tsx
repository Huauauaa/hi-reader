import { useEffect, useRef } from 'react'
import type { BookSession } from '../../lib/readers/types'

type Props = {
  session: BookSession
  layout: 'single' | 'double'
}

export function PdfView({ session, layout }: Props) {
  const page = session.getCurrentPage()
  const count = session.getPageCount()
  const scale = session.getFontScale()
  const left = session.getPage(page)
  const showRight = layout === 'double' && page + 1 < count
  const right = showRight ? session.getPage(page + 1) : null

  return (
    <div
      className={`mx-auto flex h-full min-h-0 w-full overflow-auto ${
        layout === 'double' ? 'max-w-5xl gap-px' : 'max-w-3xl justify-center'
      }`}
    >
      <PageColumn canvas={left.type === 'pdf' ? left.canvas : null} scale={scale} />
      {right && right.type === 'pdf' ? (
        <PageColumn canvas={right.canvas} scale={scale} />
      ) : null}
    </div>
  )
}

function PageColumn({ canvas, scale }: { canvas: HTMLCanvasElement | null; scale: number }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !canvas) return
    el.replaceChildren(canvas)
    return () => {
      if (canvas.parentNode === el) el.removeChild(canvas)
    }
  }, [canvas, scale])

  return (
    <article
      ref={ref}
      data-reader-page
      className="flex min-h-0 flex-1 items-start justify-center overflow-auto rounded-2xl bg-[var(--page-bg)] p-4 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--page-ink)_6%,transparent)]"
    />
  )
}
