import 'fake-indexeddb/auto'
import { it, expect, beforeEach } from 'vitest'
import { annotationsStore, clearAllAnnotationsForTests } from '../lib/annotations/store'

beforeEach(async () => {
  await clearAllAnnotationsForTests()
})

it('round-trips a highlight', async () => {
  const a = await annotationsStore.add({
    bookId: 'sample-txt',
    kind: 'highlight',
    anchor: { start: 0, end: 4, quote: 'abcd' },
    color: '#f7e8a',
  })
  const list = await annotationsStore.list('sample-txt')
  expect(list[0].anchor?.quote).toBe('abcd')
  await annotationsStore.remove(a.id)
  expect(await annotationsStore.list('sample-txt')).toHaveLength(0)
})

it('defaults highlight color to #f7e08a', async () => {
  const a = await annotationsStore.add({
    bookId: 'b',
    kind: 'highlight',
    anchor: { start: 0, end: 1, quote: 'a' },
  })
  expect(a.color).toBe('#f7e08a')
})

it('lists only the requested book and update patches body', async () => {
  const a = await annotationsStore.add({ bookId: 'one', kind: 'note', body: 'x' })
  await annotationsStore.add({ bookId: 'two', kind: 'note', body: 'y' })
  expect(await annotationsStore.list('one')).toHaveLength(1)
  const updated = await annotationsStore.update(a.id, { body: 'z' })
  expect(updated.body).toBe('z')
  expect((await annotationsStore.list('one'))[0].body).toBe('z')
})
