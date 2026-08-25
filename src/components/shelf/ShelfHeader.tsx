import type { ReactNode } from 'react'

type Props = {
  query: string
  onQueryChange: (q: string) => void
  children?: ReactNode
}

export function ShelfHeader({ query, onQueryChange, children }: Props) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-neutral-100 bg-[var(--shelf-bg)] px-6 py-4">
      <span className="shrink-0 text-lg font-semibold tracking-tight">
        hi-reader
      </span>
      <div className="flex flex-1 justify-center">
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="搜索"
          className="w-full max-w-md rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm outline-none focus:border-neutral-300"
        />
      </div>
      <div className="shrink-0">{children}</div>
    </header>
  )
}
