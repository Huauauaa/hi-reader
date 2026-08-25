import 'fake-indexeddb/auto'
import { it, expect, beforeEach } from 'vitest'
import { booksStore } from '../lib/books/store'

beforeEach(async () => {
  await booksStore.clearAll()
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
