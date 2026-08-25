import type { BookMeta, ReadingProgress } from '../types/book'

const DB_NAME = 'hi-reader'
const DB_VERSION = 1

export type BookRecord = {
  meta: BookMeta
  /** ArrayBuffer in IDB (jsdom fake-idb corrupts Blob); exposed as Blob via store */
  blob: ArrayBuffer
  contentType: string
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains('books')) {
          db.createObjectStore('books', { keyPath: 'meta.id' })
        }
        if (!db.objectStoreNames.contains('annotations')) {
          db.createObjectStore('annotations', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'bookId' })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return dbPromise
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(store, mode)
        const req = fn(t.objectStore(store))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}

export const idb = {
  getBook: (id: string) => tx<BookRecord | undefined>('books', 'readonly', (s) => s.get(id)),
  putBook: (record: BookRecord) => tx<IDBValidKey>('books', 'readwrite', (s) => s.put(record)),
  deleteBook: (id: string) => tx<undefined>('books', 'readwrite', (s) => s.delete(id)),
  listBooks: () =>
    tx<BookRecord[]>('books', 'readonly', (s) => s.getAll()),
  clearBooks: () => tx<undefined>('books', 'readwrite', (s) => s.clear()),
  getProgress: (bookId: string) =>
    tx<ReadingProgress | undefined>('progress', 'readonly', (s) => s.get(bookId)),
  putProgress: (p: ReadingProgress) =>
    tx<IDBValidKey>('progress', 'readwrite', (s) => s.put(p)),
  clearProgress: () => tx<undefined>('progress', 'readwrite', (s) => s.clear()),
}
