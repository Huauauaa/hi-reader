import 'fake-indexeddb/auto'
import { it, expect, beforeEach } from 'vitest'
import { booksStore, clearAllBooksForTests } from '../lib/books/store'

beforeEach(async () => {
  await clearAllBooksForTests()
})

it('stores and lists a local txt', async () => {
  const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
  const meta = await booksStore.addLocal(file)
  expect(meta.format).toBe('txt')
  expect(meta.source).toBe('local')
  const list = await booksStore.listLocal()
  expect(list).toHaveLength(1)
  const blob = await booksStore.getBlob(meta.id)
  expect(await blob!.text()).toBe('hello')
})

it('removeLocal deletes book and blob', async () => {
  const file = new File(['bye'], 'bye.txt', { type: 'text/plain' })
  const meta = await booksStore.addLocal(file)
  await booksStore.removeLocal(meta.id)
  expect(await booksStore.listLocal()).toHaveLength(0)
  expect(await booksStore.getBlob(meta.id)).toBeNull()
})

it('addLocal throws for unsupported format', async () => {
  const file = new File(['x'], 'doc.docx', { type: 'application/octet-stream' })
  await expect(booksStore.addLocal(file)).rejects.toThrow('Unsupported format')
})

it('addLocal uses optional title', async () => {
  const file = new File(['x'], 'book.txt', { type: 'text/plain' })
  const meta = await booksStore.addLocal(file, 'Custom Title')
  expect(meta.title).toBe('Custom Title')
})

it('saveCover writes coverUrl onto stored meta', async () => {
  const meta = await booksStore.addLocal(
    new File(['x'], 'book.txt', { type: 'text/plain' }),
  )
  await booksStore.saveCover(meta.id, 'data:image/svg+xml,cover')
  expect((await booksStore.listLocal())[0].coverUrl).toBe(
    'data:image/svg+xml,cover',
  )
})
