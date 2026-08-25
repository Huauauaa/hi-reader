import type { BookSession } from '../../lib/readers/types'

type Props = {
  session: BookSession
  layout: 'single' | 'double'
}

export function TxtView({ session, layout }: Props) {
  const page = session.getCurrentPage()
  const count = session.getPageCount()
  const scale = session.getFontScale()
  const left = session.getPage(page)
  const showRight = layout === 'double' && page + 1 < count
  const right = showRight ? session.getPage(page + 1) : null
  const fontSize = `${1.05 * scale}rem`

  return (
    <div
      className={`mx-auto flex h-full min-h-0 w-full ${
        layout === 'double' ? 'max-w-5xl gap-px' : 'max-w-3xl justify-center'
      }`}
    >
      <PageColumn fontSize={fontSize} text={left.type === 'txt' ? left.htmlOrText : ''} />
      {right && right.type === 'txt' ? (
        <PageColumn fontSize={fontSize} text={right.htmlOrText} />
      ) : null}
    </div>
  )
}

function PageColumn({ fontSize, text }: { fontSize: string; text: string }) {
  return (
    <article
      data-reader-page
      className="min-h-0 flex-1 overflow-auto rounded-2xl bg-[var(--page-bg)] px-8 py-10 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--page-ink)_6%,transparent)] md:px-12"
      style={{ fontSize }}
    >
      <p className="whitespace-pre-wrap leading-[1.85] tracking-wide text-[var(--page-ink)]">
        {text}
      </p>
    </article>
  )
}
