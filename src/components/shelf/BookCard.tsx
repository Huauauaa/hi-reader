import { Link } from 'react-router-dom'
import type { BookMeta } from '../../types/book'

type Props = { book: BookMeta }

export function BookCard({ book }: Props) {
  const initial = book.title.trim().charAt(0) || '?'

  return (
    <Link
      to={`/read/${book.id}`}
      className="group block transition-transform duration-150 hover:-translate-y-0.5"
    >
      <div className="aspect-[3/4] overflow-hidden rounded-sm bg-neutral-200 shadow-sm">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-3xl font-medium text-neutral-400">
            {initial}
          </div>
        )}
      </div>
      <p className="mt-2 truncate text-sm text-[var(--shelf-ink)]">
        {book.title}
      </p>
    </Link>
  )
}
