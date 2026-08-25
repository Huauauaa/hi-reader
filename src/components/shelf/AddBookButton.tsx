import { Plus } from '@phosphor-icons/react'

/** UI stub — file upload wired in Task 5 */
export function AddBookButton() {
  return (
    <button
      type="button"
      aria-label="添加书籍"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50"
    >
      <Plus size={18} weight="bold" />
    </button>
  )
}
