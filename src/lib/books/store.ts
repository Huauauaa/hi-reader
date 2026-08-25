import type { BookMeta } from '../../types/book'
import { idb } from '../idb'
import { detectFormat } from './detectFormat'

function titleFromFilename(name: string): string {
  const i = name.lastIndexOf('.')
  return i > 0 ? name.slice(0, i) : name
}

async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
}

export const booksStore = {
  async addLocal(file: File, title?: string): Promise<BookMeta> {
    const format = detectFormat(file.name, file.type)
    if (!format) throw new Error(`Unsupported format: ${file.name}`)

    const meta: BookMeta = {
      id: crypto.randomUUID(),
      title: title ?? titleFromFilename(file.name),
      format,
      source: 'local',
    }
    const blob = await blobToArrayBuffer(file)
    await idb.putBook({ meta, blob, contentType: file.type || 'application/octet-stream' })
    return meta
  },

  async listLocal(): Promise<BookMeta[]> {
    const records = await idb.listBooks()
    return records.filter((r) => r.meta.source === 'local').map((r) => r.meta)
  },

  async getBlob(id: string): Promise<Blob | null> {
    const record = await idb.getBook(id)
    if (!record?.blob) return null
    return new Blob([record.blob], { type: record.contentType })
  },

  async removeLocal(id: string): Promise<void> {
    await idb.deleteBook(id)
  },

  /** Test helper — clears all books from IDB */
  async clearAll(): Promise<void> {
    await idb.clearBooks()
  },
}
