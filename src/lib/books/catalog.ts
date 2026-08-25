import type { BookMeta } from '../../types/book'
import { booksStore } from './store'

export async function loadCatalog(): Promise<BookMeta[]> {
  let samples: BookMeta[] = []
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}books.json`)
    if (res.ok) samples = (await res.json()) as BookMeta[]
  } catch {
    // ponytail: samples optional; local books still list/open if books.json fails
  }
  const local = await booksStore.listLocal()
  return [...samples, ...local]
}

export function filterByTitle(books: BookMeta[], q: string): BookMeta[] {
  const s = q.trim().toLowerCase()
  if (!s) return books
  return books.filter((b) => b.title.toLowerCase().includes(s))
}
