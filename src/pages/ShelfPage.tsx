import { useCallback, useEffect, useState } from 'react'
import { AddBookButton } from '../components/shelf/AddBookButton'
import { ShelfGrid } from '../components/shelf/ShelfGrid'
import { ShelfHeader } from '../components/shelf/ShelfHeader'
import { Toast } from '../components/ui/Toast'
import { fillMissingCovers } from '../lib/books/coverFromPage'
import { filterByTitle, loadCatalog } from '../lib/books/catalog'
import type { BookMeta } from '../types/book'

export function ShelfPage() {
  const [books, setBooks] = useState<BookMeta[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const refreshCatalog = useCallback(() => {
    loadCatalog()
      .then(async (books) => {
        setBooks(books)
        setBooks(await fillMissingCovers(books))
      })
      .catch(() => setError('加载书架失败'))
  }, [])

  useEffect(() => {
    refreshCatalog()
  }, [refreshCatalog])

  const filtered = filterByTitle(books, query)

  return (
    <div className="min-h-full bg-[var(--shelf-bg)] text-[var(--shelf-ink)]">
      <ShelfHeader query={query} onQueryChange={setQuery}>
        <AddBookButton onAdded={refreshCatalog} onToast={setToast} />
      </ShelfHeader>
      {error ? (
        <p className="px-6 py-4 text-sm text-red-600">{error}</p>
      ) : (
        <ShelfGrid books={filtered} />
      )}
      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  )
}
