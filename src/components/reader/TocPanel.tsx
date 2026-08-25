import type { TocItem } from '../../lib/readers/types'

type Props = {
  items: TocItem[]
  currentPage: number
  onJump: (page: number) => void
}

export function TocPanel({ items, currentPage, onJump }: Props) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-medium tracking-wide opacity-70">目录</h2>
      {items.length === 0 ? (
        <p className="text-sm opacity-50">暂无目录</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onJump(item.page)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  item.page === currentPage
                    ? 'bg-[color-mix(in_srgb,var(--page-ink)_12%,transparent)]'
                    : 'hover:bg-[color-mix(in_srgb,var(--page-ink)_7%,transparent)]'
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
