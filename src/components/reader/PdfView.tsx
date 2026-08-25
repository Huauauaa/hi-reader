import type { BookSession } from '../../lib/readers/types'

type Props = {
  session: BookSession
  layout: 'single' | 'double'
}

export function PdfView({ session, layout }: Props) {
  const page = session.getCurrentPage()
  const count = session.getPageCount()
  const left = session.getPage(page)
  const showRight = layout === 'double' && page + 1 < count
  const right = showRight ? session.getPage(page + 1) : null

  return (
    <div
      className={`mx-auto flex h-full min-h-0 w-full overflow-auto ${
        layout === 'double' ? 'max-w-5xl gap-px' : 'max-w-3xl justify-center'
      }`}
    >
      <PageColumn canvas={left.type === 'pdf' ? left.canvas : null} />
      {right && right.type === 'pdf' ? <PageColumn canvas={right.canvas} /> : null}
    </div>
  )
}

function PageColumn({ canvas }: { canvas: HTMLCanvasElement | null }) {
  return (
    <article
      ref={(el) => {
        // ponytail: attach during commit (ref), not useEffect, so canvas is in DOM with the heading
        if (!el || !canvas) return
        if (canvas.parentNode !== el) el.replaceChildren(canvas)
      }}
      data-reader-page
      className="flex min-h-0 flex-1 items-start justify-center overflow-auto rounded-2xl bg-[var(--page-bg)] p-4 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--page-ink)_6%,transparent)]"
    />
  )
}
