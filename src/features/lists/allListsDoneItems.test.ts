import { describe, it, expect } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import { mergeDoneItems } from './allListsDoneItems'
import type { ShoppingItem } from '@/features/items/types'
import type { ShoppingList } from './types'

function fakeTimestamp(millis: number): Timestamp {
  return { toMillis: () => millis } as unknown as Timestamp
}

function makeItem(overrides: Partial<ShoppingItem> = {}): ShoppingItem {
  return {
    id: 'item-1',
    text: 'mlieko',
    status: 'done',
    activeOrder: null,
    completedAt: fakeTimestamp(100),
    completedBy: 'uid-1',
    createdAt: fakeTimestamp(0),
    createdBy: 'uid-1',
    updatedAt: fakeTimestamp(0),
    ...overrides,
  }
}

function makeList(overrides: Partial<ShoppingList> = {}): ShoppingList {
  return {
    id: 'list-1',
    name: 'Potraviny',
    createdAt: fakeTimestamp(0),
    createdBy: 'uid-1',
    ...overrides,
  }
}

describe('mergeDoneItems', () => {
  it('returns an empty array when there are no lists or no done items', () => {
    expect(mergeDoneItems([], new Map())).toEqual([])
    expect(mergeDoneItems([makeList()], new Map())).toEqual([])
  })

  it('tags each item with its origin listId and listName', () => {
    const item = makeItem({ id: 'a' })
    const lists = [makeList({ id: 'list-1', name: 'Potraviny' })]
    const doneItemsByListId = new Map([['list-1', [item]]])

    const result = mergeDoneItems(lists, doneItemsByListId)

    expect(result).toEqual([{ item, listId: 'list-1', listName: 'Potraviny' }])
  })

  it('merges done items from multiple lists sorted by completedAt descending', () => {
    const a = makeItem({ id: 'a', completedAt: fakeTimestamp(100) })
    const b = makeItem({ id: 'b', completedAt: fakeTimestamp(300) })
    const c = makeItem({ id: 'c', completedAt: fakeTimestamp(200) })
    const lists = [
      makeList({ id: 'list-1', name: 'Potraviny' }),
      makeList({ id: 'list-2', name: 'Drogéria' }),
    ]
    const doneItemsByListId = new Map([
      ['list-1', [a]],
      ['list-2', [b, c]],
    ])

    const result = mergeDoneItems(lists, doneItemsByListId)

    expect(result.map((entry) => entry.item.id)).toEqual(['b', 'c', 'a'])
  })

  it('ignores registry entries for lists no longer present (e.g. deleted lists)', () => {
    const stale = makeItem({ id: 'stale' })
    const current = makeItem({ id: 'current' })
    const lists = [makeList({ id: 'list-1', name: 'Potraviny' })]
    const doneItemsByListId = new Map([
      ['list-1', [current]],
      ['list-deleted', [stale]],
    ])

    const result = mergeDoneItems(lists, doneItemsByListId)

    expect(result.map((entry) => entry.item.id)).toEqual(['current'])
  })
})
