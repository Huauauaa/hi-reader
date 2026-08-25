import { useEffect, useRef, useState } from 'react'
import { annotationsStore } from '../../lib/annotations/store'
import type { BookSession } from '../../lib/readers/types'
import type { Annotation } from '../../types/annotation'

const HL = '#f7e08a'

type Props = {
  session: BookSession
  layout: 'single' | 'double'
  theme?: string
  bookId: string
  annotations: Annotation[]
  onChanged: () => void
}

type Pop = { cfi: string; quote: string }

export function EpubView({ session, layout, theme, bookId, annotations, onChanged }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [pop, setPop] = useState<Pop | null>(null)
  const page = session.getCurrentPage()
  const scale = session.getFontScale()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    session.attach?.(el, layout)
    session.display?.(page)
  }, [session, layout, page, scale, theme])

  useEffect(() => {
    return session.onSelected?.((sel) => {
      if (!sel.cfi) return
      setPop(sel)
    })
  }, [session])

  useEffect(() => {
    session.applyHighlights?.(
      annotations
        .filter((a) => a.kind === 'highlight' && a.anchor?.chapterId)
        .map((a) => ({ cfi: a.anchor!.chapterId!, color: a.color ?? HL })),
    )
  }, [session, annotations, page, layout, theme])

  async function save(kind: 'highlight' | 'note') {
    if (!pop) return
    const body = kind === 'note' ? window.prompt('写笔记', pop.quote) : undefined
    if (kind === 'note' && body == null) return
    await annotationsStore.add({
      bookId,
      kind,
      body: body || undefined,
      color: kind === 'highlight' ? HL : undefined,
      page,
      // ponytail: CFI in chapterId; start/end unused for epub
      anchor: { start: 0, end: 0, quote: pop.quote || pop.cfi, chapterId: pop.cfi },
    })
    setPop(null)
    onChanged()
  }

  return (
    <div className="relative mx-auto h-full min-h-0 w-full max-w-5xl">
      <div
        ref={ref}
        data-reader-page
        className="h-full min-h-0 w-full overflow-hidden rounded-2xl bg-[var(--page-bg)] [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0"
      />
      {pop ? (
        <div
          data-annot-pop
          className="absolute left-1/2 top-3 z-40 flex -translate-x-1/2 gap-1 rounded-lg bg-neutral-800 p-1 text-sm text-white shadow-lg"
        >
          <button type="button" className="rounded px-2 py-1 hover:bg-white/10" onClick={() => void save('highlight')}>
            高亮
          </button>
          <button type="button" className="rounded px-2 py-1 hover:bg-white/10" onClick={() => void save('note')}>
            写笔记
          </button>
        </div>
      ) : null}
    </div>
  )
}
