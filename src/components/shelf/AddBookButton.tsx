import { useRef } from 'react'
import { Plus } from '@phosphor-icons/react'
import { detectFormat } from '../../lib/books/detectFormat'
import { booksStore } from '../../lib/books/store'

const ACCEPT = '.pdf,.txt,.epub,application/pdf,text/plain,application/epub+zip'

type Props = {
  onAdded: () => void
  onToast: (message: string) => void
}

export function AddBookButton({ onAdded, onToast }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!detectFormat(file.name, file.type)) {
      onToast('不支持的格式')
      return
    }

    try {
      await booksStore.addLocal(file)
      onAdded()
    } catch {
      onToast('添加失败')
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        aria-label="添加书籍"
        onClick={() => inputRef.current?.click()}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50"
      >
        <Plus size={18} weight="bold" />
      </button>
    </>
  )
}
