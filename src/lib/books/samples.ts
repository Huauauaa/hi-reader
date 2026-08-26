import type { BookMeta } from '../../types/book'
import { detectFormat } from './detectFormat'

/** Paths like `.../books/nested/a.pdf` → relative `nested/a.pdf` under books root. */
function relUnderBooks(globKey: string): string {
  const norm = globKey.replace(/\\/g, '/')
  const marker = '/books/'
  const i = norm.lastIndexOf(marker)
  return i >= 0 ? norm.slice(i + marker.length) : norm.split('/').pop()!
}

export function samplesFromGlob(
  modules: Record<string, string>,
): BookMeta[] {
  const out: BookMeta[] = []
  for (const [key, url] of Object.entries(modules)) {
    const rel = relUnderBooks(key)
    const base = rel.split('/').pop()!
    const format = detectFormat(base)
    if (!format) {
      console.warn('skipping sample with unknown format', key)
      continue
    }
    // keep extension in id so sample.txt / sample.pdf do not collide
    const id = rel.split('/').join('--')
    const title = base.replace(/\.[^.]+$/, '')
    out.push({
      id,
      title,
      format,
      source: 'sample',
      filePath: url,
    })
  }
  return out
}

const globModules = import.meta.glob('../../books/**/*.{pdf,txt,epub}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export function listSampleBooks(): BookMeta[] {
  return samplesFromGlob(globModules)
}
