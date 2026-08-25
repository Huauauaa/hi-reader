import { useState } from 'react'
import { annotationsStore } from '../../lib/annotations/store'
import { pageStart, segmentsForPage } from '../../lib/annotations/txtAnchors'
import type { BookSession } from '../../lib/readers/types'
import type { Annotation } from '../../types/annotation'

const HL = '#f7e08a'

type Props = {
  session: BookSession
  layout: 'single' | 'double'
  bookId: string
  annotations: Annotation[]
  onChanged: () => void
}

type Pop = { x: number; y: number; start: number; end: number; quote: string }

function textOffset(root: Node, target: Node, offset: number): number {
  const pre = document.createRange()
  pre.selectNodeContents(root)
  try {
    pre.setEnd(target, offset)
  } catch {
    return 0
  }
  return pre.toString().length
}

export function TxtView({ session, layout, bookId, annotations, onChanged }: Props) {
  const [pop, setPop] = useState<Pop | null>(null)
  const page = session.getCurrentPage()
  const count = session.getPageCount()
  const scale = session.getFontScale()
  const left = session.getPage(page)
  const showRight = layout === 'double' && page + 1 < count
  const right = showRight ? session.getPage(page + 1) : null
  const fontSize = `${1.05 * scale}rem`
  const marks = annotations
    .filter((a) => a.kind === 'highlight' && a.anchor)
    .map((a) => ({ start: a.anchor!.start, end: a.anchor!.end, color: a.color ?? HL }))

  async function save(kind: 'highlight' | 'note') {
    if (!pop) return
    const body = kind === 'note' ? window.prompt('写笔记', pop.quote) : undefined
    if (kind === 'note' && body == null) return
    await annotationsStore.add({
      bookId,
      kind,
      body: body || undefined,
      color: kind === 'highlight' ? HL : undefined,
      anchor: { start: pop.start, end: pop.end, quote: pop.quote },
    })
    window.getSelection()?.removeAllRanges()
    setPop(null)
    onChanged()
  }

  return (
    <div
      className={`mx-auto flex h-full min-h-0 w-full ${
        layout === 'double' ? 'max-w-5xl gap-px' : 'max-w-3xl justify-center'
      }`}
    >
      <PageColumn
        fontSize={fontSize}
        text={left.type === 'txt' ? left.htmlOrText : ''}
        start={pageStart(session, page)}
        marks={marks}
        onSelect={setPop}
      />
      {right && right.type === 'txt' ? (
        <PageColumn
          fontSize={fontSize}
          text={right.htmlOrText}
          start={pageStart(session, page + 1)}
          marks={marks}
          onSelect={setPop}
        />
      ) : null}
      {pop ? (
        <div
          data-annot-pop
          className="fixed z-40 flex -translate-x-1/2 gap-1 rounded-lg bg-neutral-800 p-1 text-sm text-white shadow-lg"
          style={{ left: pop.x, top: Math.max(8, pop.y - 40) }}
        >
          <button type="button" className="rounded px-2 py-1 hover:bg-white/10" onMouseDown={(e) => e.preventDefault()} onClick={() => void save('highlight')}>
            高亮
          </button>
          <button type="button" className="rounded px-2 py-1 hover:bg-white/10" onMouseDown={(e) => e.preventDefault()} onClick={() => void save('note')}>
            写笔记
          </button>
        </div>
      ) : null}
    </div>
  )
}

function PageColumn({
  fontSize,
  text,
  start,
  marks,
  onSelect,
}: {
  fontSize: string
  text: string
  start: number
  marks: { start: number; end: number; color?: string }[]
  onSelect: (pop: Pop | null) => void
}) {
  const segs = segmentsForPage(text, start, marks)

  function onMouseUp(e: React.MouseEvent<HTMLElement>) {
    const article = e.currentTarget
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      onSelect(null)
      return
    }
    if (!article.contains(sel.anchorNode) || !article.contains(sel.focusNode)) {
      onSelect(null)
      return
    }
    const range = sel.getRangeAt(0)
    const a = textOffset(article, range.startContainer, range.startOffset)
    const b = textOffset(article, range.endContainer, range.endOffset)
    const from = start + Math.min(a, b)
    const to = start + Math.max(a, b)
    const quote = sel.toString()
    if (!quote || to <= from) {
      onSelect(null)
      return
    }
    // ponytail: jsdom Range lacks getBoundingClientRect
    const rect =
      typeof range.getBoundingClientRect === 'function'
        ? range.getBoundingClientRect()
        : { left: 0, top: 0, width: 0, height: 0 }
    onSelect({ x: rect.left + rect.width / 2, y: rect.top, start: from, end: to, quote })
  }

  return (
    <article
      data-reader-page
      className="min-h-0 flex-1 overflow-auto rounded-2xl bg-[var(--page-bg)] px-8 py-10 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--page-ink)_6%,transparent)] md:px-12"
      style={{ fontSize }}
      onMouseUp={onMouseUp}
    >
      <p className="whitespace-pre-wrap leading-[1.85] tracking-wide text-[var(--page-ink)]">
        {segs.map((s, i) =>
          s.color ? (
            <mark key={i} style={{ background: s.color, color: 'inherit' }}>
              {s.text}
            </mark>
          ) : (
            <span key={i}>{s.text}</span>
          ),
        )}
      </p>
    </article>
  )
}
