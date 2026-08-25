import { useEffect, useRef } from 'react'
import type { BookSession } from '../../lib/readers/types'

type Props = {
  session: BookSession
  layout: 'single' | 'double'
  theme?: string
}

export function EpubView({ session, layout, theme }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const page = session.getCurrentPage()
  const scale = session.getFontScale()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    session.attach?.(el, layout)
    session.display?.(page)
  }, [session, layout, page, scale, theme])

  return (
    <div
      ref={ref}
      data-reader-page
      className="mx-auto h-full min-h-0 w-full max-w-5xl overflow-hidden rounded-2xl bg-[var(--page-bg)] [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0"
    />
  )
}
