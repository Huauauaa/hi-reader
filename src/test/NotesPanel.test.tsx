import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NotesPanel } from '../components/reader/NotesPanel'
import type { Annotation } from '../types/annotation'

afterEach(() => {
  cleanup()
})

function note(over: Partial<Annotation> = {}): Annotation {
  return {
    id: 'a1',
    bookId: 'b',
    kind: 'note',
    body: 'hello',
    page: 2,
    createdAt: 1,
    updatedAt: 1,
    ...over,
  }
}

describe('NotesPanel', () => {
  it('lists items and jumps on click', () => {
    const onJump = vi.fn()
    render(
      <NotesPanel
        items={[note({ kind: 'highlight', body: undefined, anchor: { start: 0, end: 4, quote: 'abcd' } })]}
        format="txt"
        currentPage={0}
        onJump={onJump}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /abcd/ }))
    expect(onJump).toHaveBeenCalledOnce()
  })

  it('shows page label and add-note for pdf', () => {
    const onAddPageNote = vi.fn()
    render(
      <NotesPanel
        items={[note()]}
        format="pdf"
        currentPage={2}
        onJump={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onAddPageNote={onAddPageNote}
      />,
    )
    expect(screen.getByRole('button', { name: /hello.*第 3 页/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '为本页添加笔记' }))
    expect(onAddPageNote).toHaveBeenCalledOnce()
  })

  it('edits and deletes', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(
      <NotesPanel
        items={[note()]}
        format="txt"
        currentPage={0}
        onJump={vi.fn()}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '编辑' }))
    expect(onEdit).toHaveBeenCalledWith('a1')
    fireEvent.click(screen.getByRole('button', { name: '删除' }))
    expect(onDelete).toHaveBeenCalledWith('a1')
  })
})
