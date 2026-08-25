import type { BookMeta } from '../../types/book'
import { BookCard } from './BookCard'

type Props = { books: BookMeta[] }

export function ShelfGrid({ books }: Props) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-6 p-6">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  )
}
