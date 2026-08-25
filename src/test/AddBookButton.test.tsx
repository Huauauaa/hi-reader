import 'fake-indexeddb/auto'
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AddBookButton } from '../components/shelf/AddBookButton'
import { booksStore, clearAllBooksForTests } from '../lib/books/store'

beforeEach(async () => {
  await clearAllBooksForTests()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('AddBookButton', () => {
  it('toasts on unsupported format', () => {
    const onAdded = vi.fn()
    const onToast = vi.fn()
    const { container } = render(
      <AddBookButton onAdded={onAdded} onToast={onToast} />,
    )

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    const file = new File(['x'], 'doc.docx', {
      type: 'application/octet-stream',
    })
    fireEvent.change(input, { target: { files: [file] } })

    expect(onToast).toHaveBeenCalledWith('不支持的格式')
    expect(onAdded).not.toHaveBeenCalled()
  })

  it('adds local book and calls onAdded', async () => {
    const onAdded = vi.fn()
    const onToast = vi.fn()
    const { container } = render(
      <AddBookButton onAdded={onAdded} onToast={onToast} />,
    )

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => expect(onAdded).toHaveBeenCalledOnce())
    expect(onToast).not.toHaveBeenCalled()
    expect(await booksStore.listLocal()).toHaveLength(1)
  })

  it('toasts when addLocal fails', async () => {
    vi.spyOn(booksStore, 'addLocal').mockRejectedValueOnce(
      new Error('IDB error'),
    )
    const onAdded = vi.fn()
    const onToast = vi.fn()
    const { container } = render(
      <AddBookButton onAdded={onAdded} onToast={onToast} />,
    )

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => expect(onToast).toHaveBeenCalledWith('添加失败'))
    expect(onAdded).not.toHaveBeenCalled()
  })

  it('opens file picker on button click', () => {
    const { container } = render(
      <AddBookButton onAdded={() => {}} onToast={() => {}} />,
    )
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click')
    fireEvent.click(screen.getByRole('button', { name: '添加书籍' }))
    expect(clickSpy).toHaveBeenCalledOnce()
  })
})
