import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TxtView } from '../components/reader/TxtView'
import {
  annotationsStore,
  clearAllAnnotationsForTests,
} from '../lib/annotations/store'
import { createTxtSession } from '../lib/readers/txtSession'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

beforeEach(async () => {
  await clearAllAnnotationsForTests()
})

describe('TxtView', () => {
  it('shows 高亮 popover on selection and persists a highlight', async () => {
    const session = createTxtSession('hello world', 't')
    const onChanged = vi.fn()
    render(
      <TxtView
        session={session}
        layout="single"
        bookId="txt-1"
        annotations={[]}
        onChanged={onChanged}
      />,
    )
    const p = document.querySelector('[data-reader-page] p')!
    const range = document.createRange()
    range.selectNodeContents(p)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)
    fireEvent.mouseUp(p.closest('[data-reader-page]')!)
    fireEvent.click(screen.getByRole('button', { name: '高亮' }))
    await waitFor(() => expect(onChanged).toHaveBeenCalled())
    const list = await annotationsStore.list('txt-1')
    expect(list[0].kind).toBe('highlight')
    expect(list[0].anchor?.quote).toContain('hello')
  })
})
