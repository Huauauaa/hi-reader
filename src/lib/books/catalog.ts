import type { BookMeta } from '../../types/book'
import { booksStore } from './store'

export async function loadCatalog(): Promise<BookMeta[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}books.json`)
  const samples = (await res.json()) as BookMeta[]
  const local = await booksStore.listLocal()
  return [...samples, ...local]
}

export function filterByTitle(books: BookMeta[], q: string): BookMeta[] {
  const s = q.trim().toLowerCase()
  if (!s) return books
  return books.filter((b) => b.title.toLowerCase().includes(s))
}
