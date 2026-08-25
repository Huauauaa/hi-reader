import { it, expect } from 'vitest'
import { paginateTxt } from '../lib/pagination/txtPages'
import { createTxtSession } from '../lib/readers/txtSession'

it('splits by charsPerPage keeping full coverage', () => {
  const pages = paginateTxt('abcdefghij', { charsPerPage: 3 })
  expect(pages.join('')).toBe('abcdefghij')
  expect(pages).toEqual(['abc', 'def', 'ghi', 'j'])
})

it('empty text yields one empty page', () => {
  expect(paginateTxt('', { charsPerPage: 10 })).toEqual([''])
})

it('createTxtSession exposes toc, pages, and navigation', () => {
  const session = createTxtSession('x'.repeat(2700), 'Test Book')
  expect(session.format).toBe('txt')
  expect(session.title).toBe('Test Book')
  expect(session.getToc()).toEqual([{ id: 'body', label: '正文', page: 0 }])
  expect(session.getPageCount()).toBeGreaterThan(0)
  expect(session.getPage(0)).toEqual({ type: 'txt', htmlOrText: expect.any(String) })
  session.goToPage(1)
  expect(session.getCurrentPage()).toBe(1)
  session.next()
  expect(session.getCurrentPage()).toBe(2)
  session.prev()
  expect(session.getCurrentPage()).toBe(1)
  session.destroy()
})

it('larger fontScale yields fewer chars per page', () => {
  const session = createTxtSession('x'.repeat(900), 'Test Book')
  expect(session.getPageCount()).toBe(1)
  session.setFontScale(2)
  expect(session.getPageCount()).toBe(2)
})
