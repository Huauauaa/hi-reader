import { describe, it, expect } from 'vitest'
import { detectFormat } from '../lib/books/detectFormat'

describe('detectFormat', () => {
  it('detects by extension', () => {
    expect(detectFormat('a.PDF')).toBe('pdf')
    expect(detectFormat('b.txt')).toBe('txt')
    expect(detectFormat('c.epub')).toBe('epub')
  })
  it('falls back to mime', () => {
    expect(detectFormat('x', 'application/pdf')).toBe('pdf')
    expect(detectFormat('x', 'text/plain')).toBe('txt')
    expect(detectFormat('x', 'application/epub+zip')).toBe('epub')
  })
  it('returns null for unknown', () => {
    expect(detectFormat('a.docx')).toBe(null)
  })
})
