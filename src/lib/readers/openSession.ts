import { booksStore } from '../books/store'
import { createTxtSession } from './txtSession'
import type { BookSession } from './types'
import type { BookMeta } from '../../types/book'

function sampleUrl(filePath: string): string {
  return `${import.meta.env.BASE_URL}${filePath.replace(/^\//, '')}`
}

async function loadBlob(meta: BookMeta): Promise<Blob> {
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
  if (meta.format === 'epub') throw new Error('EPUB 阅读功能即将推出')
  if (meta.format === 'pdf') throw new Error('PDF 阅读功能即将推出')

  const blob = await loadBlob(meta)
  const text = await blob.text()
  return createTxtSession(text, meta.title)
}
