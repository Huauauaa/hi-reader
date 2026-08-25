import type { BookSession } from '../readers/types'

export function pageStart(session: BookSession, page: number): number {
  let n = 0
  for (let i = 0; i < page; i++) {
    const p = session.getPage(i)
    if (p.type === 'txt') n += p.htmlOrText.length
  }
  return n
}

export function pageForOffset(session: BookSession, offset: number): number {
  let acc = 0
  const count = session.getPageCount()
  for (let i = 0; i < count; i++) {
    const p = session.getPage(i)
    const len = p.type === 'txt' ? p.htmlOrText.length : 0
    if (offset < acc + len) return i
    acc += len
  }
  return Math.max(0, count - 1)
}

export function segmentsForPage(
  text: string,
  start: number,
  marks: { start: number; end: number; color?: string }[],
): { text: string; color?: string }[] {
  const end = start + text.length
  const cuts = new Set([0, text.length])
  for (const m of marks) {
    const a = Math.max(m.start, start) - start
    const b = Math.min(m.end, end) - start
    if (a < b) {
      cuts.add(a)
      cuts.add(b)
    }
  }
  const pts = [...cuts].sort((x, y) => x - y)
  const segs: { text: string; color?: string }[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    const g = start + a
    const hit = marks.find((m) => m.start <= g && g < m.end)
    segs.push({ text: text.slice(a, b), color: hit?.color })
  }
  return segs
}
