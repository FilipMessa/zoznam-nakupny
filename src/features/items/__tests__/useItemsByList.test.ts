import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import { renderHook, act } from '@testing-library/react'
import { useItemsByList } from '@/features/items/useItemsByList'
import * as itemApi from '@/features/items/itemApi'
import type { ShoppingItem } from '@/features/items/types'

vi.mock('@/features/items/itemApi', () => ({ subscribeItems: vi.fn() }))

const mockedSubscribeItems = vi.mocked(itemApi.subscribeItems)

function makeItem(overrides: Partial<ShoppingItem> = {}): ShoppingItem {
  const zero = { toMillis: () => 0 } as unknown as Timestamp
  return {
    id: 'item-1',
    text: 'mlieko',
    status: 'active',
    activeOrder: 1,
    completedAt: null,
    completedBy: null,
    createdAt: zero,
    createdBy: 'uid-1',
    updatedAt: zero,
    ...overrides,
  }
}

const listeners = new Map<string, (items: ShoppingItem[]) => void>()
const unsubscribes = new Map<string, ReturnType<typeof vi.fn>>()

function emit(listId: string, items: ShoppingItem[]) {
  act(() => listeners.get(listId)!(items))
}

function renderItemsByList(listIds: string[]) {
  return renderHook(({ listIds }) => useItemsByList(listIds), {
    initialProps: { listIds },
  })
}

describe('useItemsByList', () => {
  beforeEach(() => {
    mockedSubscribeItems.mockImplementation((listId, onNext) => {
      listeners.set(listId, onNext)
      const unsubscribe = vi.fn(() => listeners.delete(listId))
      unsubscribes.set(listId, unsubscribe)
      return unsubscribe
    })
  })

  afterEach(() => {
    listeners.clear()
    unsubscribes.clear()
    vi.clearAllMocks()
  })

  it('has an empty entry per requested list, in order, before any snapshot', () => {
    const { result } = renderItemsByList(['b', 'a'])

    expect([...result.current.keys()]).toEqual(['b', 'a'])
    expect(result.current.get('a')).toEqual({ active: [], done: [] })
  })

  it("splits each list's snapshot into sorted active and done items", () => {
    const { result } = renderItemsByList(['a'])
    const later = makeItem({ id: 'x', activeOrder: 2 })
    const earlier = makeItem({ id: 'y', activeOrder: 1 })
    const done = makeItem({ id: 'z', status: 'done', activeOrder: null })

    emit('a', [later, done, earlier])

    expect(result.current.get('a')).toEqual({
      active: [earlier, later],
      done: [done],
    })
  })

  it("keeps an unchanged list's entry referentially stable", () => {
    const { result } = renderItemsByList(['a', 'b'])
    emit('b', [makeItem({ id: 'x' })])
    const before = result.current.get('b')

    emit('a', [makeItem({ id: 'y' })])

    expect(result.current.get('b')).toBe(before)
  })

  it('does not resubscribe when re-rendered with the same ids in a new array', () => {
    const { rerender } = renderItemsByList(['a', 'b'])

    rerender({ listIds: ['a', 'b'] })

    expect(mockedSubscribeItems).toHaveBeenCalledTimes(2)
  })

  it('subscribes to added lists and unsubscribes from removed ones only', () => {
    const { result, rerender } = renderItemsByList(['a', 'b'])
    emit('b', [makeItem({ id: 'x' })])
    const unsubscribeA = unsubscribes.get('a')!
    const unsubscribeB = unsubscribes.get('b')!

    rerender({ listIds: ['b', 'c'] })

    expect(unsubscribeA).toHaveBeenCalledTimes(1)
    expect(unsubscribeB).not.toHaveBeenCalled()
    expect(mockedSubscribeItems).toHaveBeenCalledTimes(3)
    expect(mockedSubscribeItems.mock.calls[2][0]).toBe('c')
    expect([...result.current.keys()]).toEqual(['b', 'c'])
  })

  it('unsubscribes from every list on unmount', () => {
    const { unmount } = renderItemsByList(['a', 'b'])
    const all = [...unsubscribes.values()]

    unmount()

    for (const unsubscribe of all) {
      expect(unsubscribe).toHaveBeenCalledTimes(1)
    }
  })
})
