import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ReaderShell } from '../components/reader/ReaderShell'
import { loadCatalog } from '../lib/books/catalog'
import { progressStore } from '../lib/progress/store'
import { openSession } from '../lib/readers/openSession'
import type { BookSession } from '../lib/readers/types'
import type { ReadingProgress } from '../types/book'

export function ReaderPage() {
  const { id } = useParams()
  const [session, setSession] = useState<BookSession | null>(null)
  const [theme, setTheme] = useState<ReadingProgress['theme']>('dark')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let opened: BookSession | null = null
    setLoading(true)
    setError(null)
    setSession(null)

    ;(async () => {
      try {
        const catalog = await loadCatalog()
        const meta = catalog.find((b) => b.id === id)
        if (!meta) throw new Error('找不到这本书')
        const s = await openSession(meta)
        const progress = await progressStore.get(meta.id)
        if (progress) {
          s.setLayout(progress.layout)
          s.setFontScale(progress.fontScale)
          s.goToPage(progress.page)
        }
        if (cancelled) {
          s.destroy()
          return
        }
        opened = s
        setTheme(progress?.theme ?? 'dark')
        setSession(s)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '打开失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
      opened?.destroy()
    }
  }, [id])

  if (loading) {
    return (
      <div className="reader-root flex h-full items-center justify-center text-sm opacity-60" data-theme="dark">
        加载中…
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="reader-root flex h-full flex-col items-center justify-center gap-4" data-theme="dark">
        <p>{error ?? '打开失败'}</p>
        <Link to="/" className="text-sm opacity-70 hover:opacity-100">
          返回书架
        </Link>
      </div>
    )
  }

  return <ReaderShell session={session} bookId={id ?? session.title} initialTheme={theme} />
}
