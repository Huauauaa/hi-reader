export type Annotation = {
  id: string
  bookId: string
  kind: 'highlight' | 'note' | 'bookmark'
  anchor?: { start: number; end: number; quote: string; chapterId?: string }
  page?: number
  body?: string
  color?: string
  createdAt: number
  updatedAt: number
}
