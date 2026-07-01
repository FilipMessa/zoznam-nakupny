import { describe, it, expect } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import {
  sortItems,
  completeItemPatch,
  restoreItemPatch,
  nextActiveOrder,
} from './itemLogic'
import type { ShoppingItem } from './types'

// Fabricates a Timestamp-shaped value (only the `toMillis()` member that
// itemLogic actually relies on) without pulling in the firebase/firestore
// runtime -- itemLogic.ts must have zero Firestore imports, and this keeps
// the test file's only firebase dependency a type-only import (erased at
// build time, same as src/features/lists/types.ts).
function fakeTimestamp(millis: number): Timestamp {
  return { toMillis: () => millis } as unknown as Timestamp
}

function makeItem(overrides: Partial<ShoppingItem> = {}): ShoppingItem {
  return {
    id: 'item-1',
    text: 'mlieko',
    status: 'active',
    activeOrder: 1,
    completedAt: null,
    completedBy: null,
    createdAt: fakeTimestamp(0),
    createdBy: 'uid-1',
    updatedAt: fakeTimestamp(0),
    ...overrides,
  }
}

describe('sortItems', () => {
  it('sorts active items by activeOrder ascending', () => {
    const a = makeItem({ id: 'a', status: 'active', activeOrder: 3 })
    const b = makeItem({ id: 'b', status: 'active', activeOrder: 1 })
    const c = makeItem({ id: 'c', status: 'active', activeOrder: 2 })

    const { active } = sortItems([a, b, c])

    expect(active.map((item) => item.id)).toEqual(['b', 'c', 'a'])
  })

  it('sorts done items by completedAt ascending', () => {
    const a = makeItem({
      id: 'a',
      status: 'done',
      activeOrder: null,
      completedAt: fakeTimestamp(300),
      completedBy: 'uid-1',
    })
    const b = makeItem({
      id: 'b',
      status: 'done',
      activeOrder: null,
      completedAt: fakeTimestamp(100),
      completedBy: 'uid-1',
    })
    const c = makeItem({
      id: 'c',
      status: 'done',
      activeOrder: null,
      completedAt: fakeTimestamp(200),
      completedBy: 'uid-1',
    })

    const { done } = sortItems([a, b, c])

    expect(done.map((item) => item.id)).toEqual(['b', 'c', 'a'])
  })

  it('returns active and done items in separate lists, active items first', () => {
    const active = makeItem({ id: 'active-1', status: 'active', activeOrder: 1 })
    const done = makeItem({
      id: 'done-1',
      status: 'done',
      activeOrder: null,
      completedAt: fakeTimestamp(100),
      completedBy: 'uid-1',
    })

    const result = sortItems([done, active])

    expect(result).toEqual({ active: [active], done: [done] })
  })

  it('supports an empty items array', () => {
    expect(sortItems([])).toEqual({ active: [], done: [] })
  })
})

describe('completeItemPatch', () => {
  it('creates a done patch from an active item', () => {
    const item = makeItem({ status: 'active', activeOrder: 5 })

    const patch = completeItemPatch(item, 'uid-completer', 'INJECTED_TIMESTAMP')

    expect(patch).toEqual({
      status: 'done',
      completedAt: 'INJECTED_TIMESTAMP',
      completedBy: 'uid-completer',
      updatedAt: 'INJECTED_TIMESTAMP',
    })
  })

  it('sets completedAt from the injected value, not a value it computes itself', () => {
    const item = makeItem({ status: 'active', activeOrder: 1 })
    const injected = { sentinel: 'clock-value' }

    const patch = completeItemPatch(item, 'uid-completer', injected)

    expect(patch.completedAt).toBe(injected)
    expect(patch.updatedAt).toBe(injected)
  })
})

describe('restoreItemPatch', () => {
  it('creates an active patch that appends the item to the end of active order', () => {
    const item = makeItem({
      status: 'done',
      activeOrder: null,
      completedAt: fakeTimestamp(100),
      completedBy: 'uid-completer',
    })

    const patch = restoreItemPatch(item, 4, 'INJECTED_TIMESTAMP')

    expect(patch).toEqual({
      status: 'active',
      activeOrder: 4,
      completedAt: null,
      completedBy: null,
      updatedAt: 'INJECTED_TIMESTAMP',
    })
  })

  it('clears completedAt and completedBy regardless of their previous values', () => {
    const item = makeItem({
      status: 'done',
      activeOrder: null,
      completedAt: fakeTimestamp(999),
      completedBy: 'uid-completer',
    })

    const patch = restoreItemPatch(item, 1, 'INJECTED_TIMESTAMP')

    expect(patch.completedAt).toBeNull()
    expect(patch.completedBy).toBeNull()
  })
})

describe('nextActiveOrder', () => {
  it('returns 1 for an empty active list', () => {
    expect(nextActiveOrder([])).toBe(1)
  })

  it('returns max(activeOrder) + 1 for a non-empty active list', () => {
    const items = [
      makeItem({ id: 'a', status: 'active', activeOrder: 2 }),
      makeItem({ id: 'b', status: 'active', activeOrder: 5 }),
      makeItem({ id: 'c', status: 'active', activeOrder: 1 }),
    ]

    expect(nextActiveOrder(items)).toBe(6)
  })

  it('ignores done items (null activeOrder) when computing the max', () => {
    const items = [
      makeItem({ id: 'a', status: 'active', activeOrder: 3 }),
      makeItem({
        id: 'b',
        status: 'done',
        activeOrder: null,
        completedAt: fakeTimestamp(1),
        completedBy: 'uid-1',
      }),
    ]

    expect(nextActiveOrder(items)).toBe(4)
  })

  it('does not let a null activeOrder from a done item be treated as 0 and short-circuit the max', () => {
    // If null were coerced to 0 via a naive default before filtering, a
    // single done item passed alongside an active item with a *negative*
    // fractional-looking activeOrder would still need to be excluded from
    // the max computation -- this guards against filtering being skipped.
    const items = [
      makeItem({ id: 'a', status: 'active', activeOrder: -1 }),
      makeItem({
        id: 'b',
        status: 'done',
        activeOrder: null,
        completedAt: fakeTimestamp(1),
        completedBy: 'uid-1',
      }),
    ]

    expect(nextActiveOrder(items)).toBe(0)
  })
})
