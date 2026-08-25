import type { BookFormat } from '../../types/book'
import type { Annotation } from '../../types/annotation'

type Props = {
  items: Annotation[]
  format: BookFormat
  currentPage: number
  onJump: (a: Annotation) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onAddPageNote?: () => void
  onAddBookmark?: () => void
}

function label(a: Annotation): string {
  return (
    a.body?.trim() ||
    a.anchor?.quote ||
    (a.kind === 'bookmark' ? '书签' : '笔记')
  )
}

export function NotesPanel({
  items,
  format,
  currentPage,
  onJump,
  onEdit,
  onDelete,
  onAddPageNote,
  onAddBookmark,
}: Props) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-medium tracking-wide opacity-70">
        笔记
      </h2>
      {format === 'pdf' ? (
        <div className="mb-4 flex flex-col gap-1">
          {onAddPageNote ? (
            <button
              type="button"
              onClick={onAddPageNote}
              className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[color-mix(in_srgb,var(--page-ink)_7%,transparent)]"
            >
              为本页添加笔记
            </button>
          ) : null}
          {onAddBookmark ? (
            <button
              type="button"
              onClick={onAddBookmark}
              className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[color-mix(in_srgb,var(--page-ink)_7%,transparent)]"
            >
              添加书签
            </button>
          ) : null}
          <p className="px-3 text-xs opacity-40">当前第 {currentPage + 1} 页</p>
        </div>
      ) : null}
      {items.length === 0 ? (
        <p className="text-sm opacity-50">暂无笔记</p>
      ) : (
        <ul className="space-y-1">
          {items.map((a) => (
            <li
              key={a.id}
              className="rounded-lg px-3 py-2 hover:bg-[color-mix(in_srgb,var(--page-ink)_7%,transparent)]"
            >
              <button
                type="button"
                onClick={() => onJump(a)}
                className="w-full text-left text-sm"
              >
                {label(a)}
                {a.page != null ? (
                  <span className="opacity-50"> 第 {a.page + 1} 页</span>
                ) : null}
              </button>
              <div className="mt-1 flex gap-2 text-xs opacity-60">
                <button type="button" onClick={() => onEdit(a.id)}>
                  编辑
                </button>
                <button type="button" onClick={() => onDelete(a.id)}>
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
