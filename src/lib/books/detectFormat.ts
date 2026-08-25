import type { BookFormat } from '../../types/book'

const EXT: Record<string, BookFormat> = {
  pdf: 'pdf',
  txt: 'txt',
  epub: 'epub',
}

const MIME: Record<string, BookFormat> = {
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'application/epub+zip': 'epub',
}

export function detectFormat(
  filename: string,
  mime?: string,
): BookFormat | null {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext && ext in EXT) return EXT[ext]
  if (mime && mime in MIME) return MIME[mime]
  return null
}
