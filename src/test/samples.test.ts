import { it, expect, vi } from 'vitest'
import { samplesFromGlob } from '../lib/books/samples'

it('maps glob paths to BookMeta', () => {
  const books = samplesFromGlob({
    '/src/books/sample.txt': '/hi-reader/assets/sample-abc.txt',
    '/src/books/nested/a.pdf': '/hi-reader/assets/a-def.pdf',
  })
  expect(books).toEqual([
    {
      id: 'sample.txt',
      title: 'sample',
      format: 'txt',
      source: 'sample',
      filePath: '/hi-reader/assets/sample-abc.txt',
    },
    {
      id: 'nested--a.pdf',
      title: 'a',
      format: 'pdf',
      source: 'sample',
      filePath: '/hi-reader/assets/a-def.pdf',
    },
  ])
})

it('uses basename without ext as title including CJK and spaces', () => {
  const name = '无人生还 (（英）阿加莎·克里斯蒂著；夏阳译) '
  const books = samplesFromGlob({
    [`/src/books/${name}.epub`]: '/u.epub',
  })
  expect(books[0]).toMatchObject({
    id: `${name}.epub`,
    title: name,
    format: 'epub',
  })
})

it('skips and warns when detectFormat fails', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  expect(samplesFromGlob({ '/src/books/x.docx': '/x.docx' })).toEqual([])
  expect(warn).toHaveBeenCalled()
  warn.mockRestore()
})
