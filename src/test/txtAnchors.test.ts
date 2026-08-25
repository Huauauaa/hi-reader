import { it, expect } from 'vitest'
import {
  pageForOffset,
  pageStart,
  segmentsForPage,
} from '../lib/annotations/txtAnchors'
import { createTxtSession } from '../lib/readers/txtSession'

it('maps page-local offsets to global text and back', () => {
  const session = createTxtSession('A'.repeat(900) + 'B'.repeat(900), 't')
  expect(pageStart(session, 0)).toBe(0)
  expect(pageStart(session, 1)).toBe(900)
  expect(pageForOffset(session, 0)).toBe(0)
  expect(pageForOffset(session, 899)).toBe(0)
  expect(pageForOffset(session, 900)).toBe(1)
})

it('wraps overlapping page text into mark segments', () => {
  const segs = segmentsForPage('abcdefgh', 10, [
    { start: 12, end: 16, color: '#f7e08a' },
  ])
  expect(segs.map((s) => s.text).join('')).toBe('abcdefgh')
  expect(
    segs
      .filter((s) => s.color)
      .map((s) => s.text)
      .join(''),
  ).toBe('cdef')
})
