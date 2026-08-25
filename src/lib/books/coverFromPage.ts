import ePubMod from 'epubjs'
import type { Book } from 'epubjs'
import * as pdfjs from 'pdfjs-dist'
import type { BookFormat, BookMeta } from '../../types/book'
import { loadBlob } from '../readers/openSession'
import { booksStore } from './store'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const COVER_W = 240

function openEpub(data: ArrayBuffer): Book {
  const ePub =
    typeof ePubMod === 'function'
      ? ePubMod
      : (ePubMod as unknown as { default: (data: ArrayBuffer) => Book }).default
  return ePub(data)
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function txtCover(text: string): string | undefined {
  const excerpt = text.replace(/\s+/g, ' ').trim().slice(0, 140)
  if (!excerpt) return undefined
  const lines: string[] = []
  for (let i = 0; i < excerpt.length && lines.length < 14; i += 12) {
    lines.push(escapeXml(excerpt.slice(i, i + 12)))
  }
  const tspans = lines
    .map((line, i) => `<tspan x="20" dy="${i === 0 ? 0 : 20}">${line}</tspan>`)
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320"><rect width="240" height="320" fill="#f5f5f5"/><text y="36" font-size="14" fill="#525252" font-family="sans-serif">${tspans}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function pdfCover(blob: Blob): Promise<string> {
  const loadingTask = pdfjs.getDocument({ data: await blob.arrayBuffer() })
  try {
    const pdf = await loadingTask.promise
    const page = await pdf.getPage(1)
    const base = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: COVER_W / base.width })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvas, viewport }).promise
    return canvas.toDataURL('image/jpeg', 0.72)
  } finally {
    await loadingTask.destroy()
  }
}

async function epubCover(blob: Blob): Promise<string | undefined> {
  const book = openEpub(await blob.arrayBuffer())
  try {
    await book.ready
    const cover = await book.coverUrl()
    if (cover) {
      if (cover.startsWith('data:')) return cover
      const img = await fetch(cover)
      if (img.ok) return blobToDataUrl(await img.blob())
    }
    const href = book.spine.get(0)?.href
    if (!href) return undefined
    const doc = (await book.load(href)) as {
      documentElement?: { textContent?: string | null }
    }
    return txtCover(doc.documentElement?.textContent ?? '')
  } finally {
    book.destroy()
  }
}

export async function coverFromFirstPage(
  format: BookFormat,
  blob: Blob,
): Promise<string | undefined> {
  try {
    if (format === 'txt') return txtCover(await blob.text())
    if (format === 'pdf') return pdfCover(blob)
    return epubCover(blob)
  } catch {
    return undefined
  }
}

export async function fillMissingCovers(
  books: BookMeta[],
): Promise<BookMeta[]> {
  const out = books.map((b) => ({ ...b }))
  for (const book of out) {
    if (book.coverUrl) continue
    try {
      const coverUrl = await coverFromFirstPage(
        book.format,
        await loadBlob(book),
      )
      if (!coverUrl) continue
      book.coverUrl = coverUrl
      if (book.source === 'local') await booksStore.saveCover(book.id, coverUrl)
    } catch {
      // ponytail: keep letter placeholder if page render fails
    }
  }
  return out
}
