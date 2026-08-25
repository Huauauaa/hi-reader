import { it, expect } from 'vitest'
import { slashRedirect } from '../lib/slashRedirect'

it('redirects /hi-reader to /hi-reader/', () => {
  expect(slashRedirect('/hi-reader', '/hi-reader/')).toBe('/hi-reader/')
})

it('keeps the query string', () => {
  expect(slashRedirect('/hi-reader?q=pdf', '/hi-reader/')).toBe(
    '/hi-reader/?q=pdf',
  )
})

it('does not redirect the slashed base or other paths', () => {
  expect(slashRedirect('/hi-reader/', '/hi-reader/')).toBeNull()
  expect(slashRedirect('/hi-reader/read/1', '/hi-reader/')).toBeNull()
  expect(slashRedirect('/', '/hi-reader/')).toBeNull()
})
