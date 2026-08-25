import { booksStore } from '../books/store'
import { createEpubSession } from './epubSession'
import { createPdfSession } from './pdfSession'
import { createTxtSession } from './txtSession'
import type { BookSession } from './types'
import type { BookMeta } from '../../types/book'

function sampleUrl(filePath: string): string {
  // encodeURI keeps `/`; percent-encodes spaces / CJK / punctuation in filenames
  return `${import.meta.env.BASE_URL}${encodeURI(filePath.replace(/^\//, ''))}`
}

export async function loadBlob(meta: BookMeta): Promise<Blob> {
  if (meta.source === 'sample') {
    if (!meta.filePath) throw new Error('Sample book missing filePath')
    const res = await fetch(sampleUrl(meta.filePath))
    if (!res.ok) throw new Error(`Failed to fetch sample: ${res.status}`)
    return res.blob()
  }
  const blob = await booksStore.getBlob(meta.id)
  if (!blob) throw new Error(`Book not found: ${meta.id}`)
  return blob
}

export async function openSession(meta: BookMeta): Promise<BookSession> {
  const blob = await loadBlob(meta)
  if (meta.format === 'epub') return createEpubSession(blob, meta.title)
  if (meta.format === 'pdf') return createPdfSession(blob, meta.title)
  const text = await blob.text()
  return createTxtSession(text, meta.title)
}
