export type BookFormat = 'pdf' | 'txt' | 'epub'

export type BookMeta = {
  id: string
  title: string
  format: BookFormat
  source: 'sample' | 'local'
  /** public URL path for samples, relative to base */
  filePath?: string
  coverUrl?: string
}

export type ReadingProgress = {
  bookId: string
  page: number
  layout: 'single' | 'double'
  theme: 'light' | 'sepia' | 'dark'
  fontScale: number
  updatedAt: number
}
