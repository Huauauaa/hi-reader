import { useEffect } from 'react'

type Props = {
  message: string | null
  onClose: () => void
  durationMs?: number
}

export function Toast({ message, onClose, durationMs = 3000 }: Props) {
  useEffect(() => {
    if (!message) return
    const id = setTimeout(onClose, durationMs)
    return () => clearTimeout(id)
  }, [message, onClose, durationMs])

  if (!message) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-neutral-800 px-4 py-2 text-sm text-white shadow-lg"
    >
      {message}
    </div>
  )
}
