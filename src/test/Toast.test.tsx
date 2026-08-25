import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Toast } from '../components/ui/Toast'

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when message is null', () => {
    const { container } = render(<Toast message={null} onClose={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows message and auto-dismisses', () => {
    const onClose = vi.fn()
    render(<Toast message="不支持的格式" onClose={onClose} durationMs={3000} />)

    expect(screen.getByRole('status')).toHaveTextContent('不支持的格式')

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(onClose).toHaveBeenCalledOnce()
  })
})
