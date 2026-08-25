import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen } from '@phosphor-icons/react'
import { EpubView } from './EpubView'
import { FontPanel } from './FontPanel'
import { PdfView } from './PdfView'
import { ReaderToolbar, type ReaderPanel } from './ReaderToolbar'
import { ThemePanel } from './ThemePanel'
import { TocPanel } from './TocPanel'
import { TxtView } from './TxtView'
import { Toast } from '../ui/Toast'
import { progressStore } from '../../lib/progress/store'
import type { BookSession } from '../../lib/readers/types'
import type { ReadingProgress } from '../../types/book'

type Props = {
  session: BookSession
  bookId: string
  initialTheme?: ReadingProgress['theme']
}

function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(
    () => window.matchMedia?.('(max-width: 767px)')?.matches ?? false,
  )
  useEffect(() => {
    const mq = window.matchMedia?.('(max-width: 767px)')
    if (!mq) return
    const onChange = () => setNarrow(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return narrow
}

export function ReaderShell({ session, bookId, initialTheme = 'dark' }: Props) {
  const [theme, setTheme] = useState<ReadingProgress['theme']>(initialTheme)
  const [panel, setPanel] = useState<ReaderPanel | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [rev, setRev] = useState(0)
  const narrow = useNarrow()

  const bump = () => setRev((n) => n + 1)
  const layout = session.getLayout()
  const effectiveLayout = narrow ? 'single' : layout
  const page = session.getCurrentPage()
  const count = session.getPageCount()
  const step = effectiveLayout === 'double' ? 2 : 1

  function go(delta: number) {
    session.goToPage(page + delta)
    bump()
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setPanel(null)
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-step)
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        go(step)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // ponytail: rebind on page/layout; skip if input-focus ever appears
  }, [page, step])

  const persistRef = useRef(() => {})
  persistRef.current = () => {
    void progressStore.save({
      bookId,
      page: session.getCurrentPage(),
      layout: session.getLayout(),
      theme,
      fontScale: session.getFontScale(),
      updatedAt: Date.now(),
    })
  }

  useEffect(() => {
    const t = setTimeout(() => persistRef.current(), 200)
    return () => clearTimeout(t)
  }, [bookId, session, theme, rev])

  useEffect(() => () => persistRef.current(), [])

  const pageLabel =
    effectiveLayout === 'double' && page + 1 < count
      ? `${page + 1}–${page + 2} / ${count}`
      : `${page + 1} / ${count}`

  return (
    <div className="reader-root relative flex h-full min-h-full flex-col" data-theme={theme}>
      <header className="flex shrink-0 items-center gap-3 px-5 py-3">
        <BookOpen size={22} className="shrink-0 opacity-80" />
        <h1 className="min-w-0 flex-1 truncate text-[15px] font-medium">{session.title}</h1>
        <nav className="flex shrink-0 items-center gap-2 text-[13px] opacity-55">
          <Link to="/" className="hover:opacity-100">
            首页
          </Link>
          <span aria-hidden="true">|</span>
          <Link to="/" className="hover:opacity-100">
            我的书架
          </Link>
        </nav>
      </header>

      <main className="flex min-h-0 flex-1 flex-col px-4 pb-2 pr-16 md:px-16 md:pr-24">
        {session.format === 'txt' ? (
          <TxtView session={session} layout={effectiveLayout} />
        ) : session.format === 'epub' ? (
          <EpubView session={session} layout={effectiveLayout} theme={theme} />
        ) : session.format === 'pdf' ? (
          <PdfView session={session} layout={effectiveLayout} />
        ) : (
          <p className="p-8 text-sm opacity-60">该格式尚未接入阅读视图</p>
        )}
      </main>

      <footer className="flex shrink-0 items-center justify-center gap-8 py-3 text-sm">
        <button
          type="button"
          disabled={page <= 0}
          onClick={() => go(-step)}
          className="opacity-70 hover:opacity-100 disabled:opacity-25"
        >
          上一页
        </button>
        <span className="tabular-nums opacity-45">{pageLabel}</span>
        <button
          type="button"
          disabled={page + step >= count}
          onClick={() => go(step)}
          className="opacity-70 hover:opacity-100 disabled:opacity-25"
        >
          下一页
        </button>
      </footer>

      <ReaderToolbar
        active={panel}
        layout={layout}
        onToggle={(id) => setPanel((p) => (p === id ? null : id))}
        onLayoutToggle={() => {
          session.setLayout(layout === 'single' ? 'double' : 'single')
          bump()
        }}
        onSoon={() => setToast('即将推出')}
      />

      {panel ? (
        <aside className="reader-panel absolute inset-y-14 right-0 z-20 w-72 overflow-auto border-l border-[color-mix(in_srgb,var(--page-ink)_10%,transparent)] bg-[var(--reader-bg)] px-5 py-6 shadow-[-12px_0_32px_rgba(0,0,0,0.18)]">
          {panel === 'toc' ? (
            <TocPanel
              items={session.getToc()}
              currentPage={page}
              onJump={(n) => {
                session.goToPage(n)
                bump()
                setPanel(null)
              }}
            />
          ) : null}
          {panel === 'font' ? (
            <FontPanel
              fontScale={session.getFontScale()}
              onChange={(n) => {
                session.setFontScale(n)
                bump()
              }}
            />
          ) : null}
          {panel === 'theme' ? <ThemePanel theme={theme} onChange={setTheme} /> : null}
        </aside>
      ) : null}

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  )
}
