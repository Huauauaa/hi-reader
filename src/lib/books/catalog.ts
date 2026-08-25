import type { BookFormat, BookMeta } from '../../types/book'
import { booksStore } from './store'

const FORMATS = new Set<BookFormat>(['pdf', 'txt', 'epub'])

function isUsableBook(book: unknown): book is BookMeta {
  if (!book || typeof book !== 'object') {
    console.warn('skipping broken catalog entry', book)
    return false
  }
  const b = book as BookMeta
  if (!b.id || !b.title || !FORMATS.has(b.format)) {
    console.warn('skipping broken catalog entry', book)
    return false
  }
  if (b.source === 'sample' && !b.filePath) {
    console.warn('skipping sample without filePath', book)
    return false
  }
  return true
}

export async function loadCatalog(): Promise<BookMeta[]> {
  let samples: BookMeta[] = []
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}books.json`)
    if (res.ok) {
      const raw: unknown = await res.json()
      if (!Array.isArray(raw)) console.warn('sample catalog is not an array')
      else samples = raw.filter(isUsableBook)
    } else {
      console.warn('sample catalog fetch failed', res.status)
    }
  } catch (e) {
    // ponytail: samples optional; local books still list/open if books.json fails
    console.warn('sample catalog unavailable', e)
  }
  const local = (await booksStore.listLocal()).filter(isUsableBook)
  return [...samples, ...local]
}

export function filterByTitle(books: BookMeta[], q: string): BookMeta[] {
  const s = q.trim().toLowerCase()
  if (!s) return books
  return books.filter((b) => b.title.toLowerCase().includes(s))
}
