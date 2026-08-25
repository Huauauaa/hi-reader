import { useEffect, useState } from 'react'
import { AddBookButton } from '../components/shelf/AddBookButton'
import { ShelfGrid } from '../components/shelf/ShelfGrid'
import { ShelfHeader } from '../components/shelf/ShelfHeader'
import { filterByTitle, loadCatalog } from '../lib/books/catalog'
import type { BookMeta } from '../types/book'

export function ShelfPage() {
  const [books, setBooks] = useState<BookMeta[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCatalog().then(setBooks).catch(() => setError('加载书架失败'))
  }, [])

  const filtered = filterByTitle(books, query)

  return (
    <div className="min-h-full bg-[var(--shelf-bg)] text-[var(--shelf-ink)]">
      <ShelfHeader query={query} onQueryChange={setQuery}>
        <AddBookButton />
      </ShelfHeader>
      {error ? (
        <p className="px-6 py-4 text-sm text-red-600">{error}</p>
      ) : (
        <ShelfGrid books={filtered} />
      )}
    </div>
  )
}
