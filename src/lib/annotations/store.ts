import { idb } from '../idb'
import type { Annotation } from '../../types/annotation'

export type AnnotationDraft = Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>

const DEFAULT_HIGHLIGHT = '#f7e08a'

export const annotationsStore = {
  async list(bookId: string): Promise<Annotation[]> {
    const all = await idb.listAnnotations()
    return all.filter((a) => a.bookId === bookId).sort((a, b) => a.createdAt - b.createdAt)
  },

  async add(draft: AnnotationDraft): Promise<Annotation> {
    const now = Date.now()
    const a: Annotation = {
      ...draft,
      id: crypto.randomUUID(),
      color: draft.color ?? (draft.kind === 'highlight' ? DEFAULT_HIGHLIGHT : undefined),
      createdAt: now,
      updatedAt: now,
    }
    await idb.putAnnotation(a)
    return a
  },

  async update(id: string, patch: Partial<AnnotationDraft>): Promise<Annotation> {
    const cur = await idb.getAnnotation(id)
    if (!cur) throw new Error(`annotation not found: ${id}`)
    const next: Annotation = { ...cur, ...patch, id, bookId: cur.bookId, createdAt: cur.createdAt, updatedAt: Date.now() }
    await idb.putAnnotation(next)
    return next
  },

  async remove(id: string): Promise<void> {
    await idb.deleteAnnotation(id)
  },
}

/** Test-only — clears all annotations from IDB */
export async function clearAllAnnotationsForTests(): Promise<void> {
  await idb.clearAnnotations()
}
