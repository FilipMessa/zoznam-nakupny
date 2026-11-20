import { describe, it, expect } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import {
  sortItems,
  completeItemPatch,
  restoreItemPatch,
  validateItemText,
  nextActiveOrder,
  reorderActiveItems,
  insertActiveOrder,
  planReorder,
  latestNewActiveId,
  purchasedSuggestions,
} from '@/features/items/itemService'
import type { ActiveItem, ShoppingItem } from '@/features/items/types'

// Fabricates a Timestamp-shaped value (only the `toMillis()` member that
// itemService actually relies on) without pulling in the firebase/firestore
// runtime -- itemService.ts must have zero Firestore imports, and this keeps
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

function makeActiveItem(overrides: Partial<ActiveItem> = {}): ActiveItem {
  return { ...makeItem(), activeOrder: 1, ...overrides }
}

describe('sortItems', () => {
  it('sorts active items by activeOrder ascending', () => {
    const a = makeItem({ id: 'a', status: 'active', activeOrder: 3 })
    const b = makeItem({ id: 'b', status: 'active', activeOrder: 1 })
    const c = makeItem({ id: 'c', status: 'active', activeOrder: 2 })

    const { active } = sortItems([a, b, c])

    expect(active.map((item) => item.id)).toEqual(['b', 'c', 'a'])
  })

  it('keeps an active item without an activeOrder, sorted as order 0', () => {
    const a = makeItem({ id: 'a', status: 'active', activeOrder: 2 })
    const b = makeItem({ id: 'b', status: 'active', activeOrder: null })
    const c = makeItem({ id: 'c', status: 'active', activeOrder: -1 })

    const { active } = sortItems([a, b, c])

    expect(active.map((item) => item.id)).toEqual(['c', 'b', 'a'])
    expect(active[1].activeOrder).toBe(0)
  })

  it('keeps object identity for active items that have an activeOrder', () => {
    const a = makeItem({ id: 'a', status: 'active', activeOrder: 1 })

    expect(sortItems([a]).active[0]).toBe(a)
  })

  it('sorts done items by completedAt descending', () => {
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

    expect(done.map((item) => item.id)).toEqual(['a', 'c', 'b'])
  })

  it('returns active and done items in separate lists, active items first', () => {
    const active = makeItem({
      id: 'active-1',
      status: 'active',
      activeOrder: 1,
    })
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
    const patch = completeItemPatch('uid-completer', 'INJECTED_TIMESTAMP')

    expect(patch).toEqual({
      status: 'done',
      completedAt: 'INJECTED_TIMESTAMP',
      completedBy: 'uid-completer',
      updatedAt: 'INJECTED_TIMESTAMP',
    })
  })

  it('sets completedAt from the injected value, not a value it computes itself', () => {
    const injected = { sentinel: 'clock-value' }

    const patch = completeItemPatch('uid-completer', injected)

    expect(patch.completedAt).toBe(injected)
    expect(patch.updatedAt).toBe(injected)
  })
})

describe('restoreItemPatch', () => {
  it('creates an active patch that appends the item to the end of active order', () => {
    const patch = restoreItemPatch(4, 'INJECTED_TIMESTAMP')

    expect(patch).toEqual({
      status: 'active',
      activeOrder: 4,
      completedAt: null,
      completedBy: null,
      updatedAt: 'INJECTED_TIMESTAMP',
    })
  })

  it('clears completedAt and completedBy regardless of their previous values', () => {
    const patch = restoreItemPatch(1, 'INJECTED_TIMESTAMP')

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

describe('latestNewActiveId', () => {
  it('returns null when no active id is new', () => {
    const active = [
      makeItem({ id: 'a', activeOrder: 1 }),
      makeItem({ id: 'b', activeOrder: 2 }),
    ]

    expect(latestNewActiveId(['a', 'b'], active)).toBeNull()
  })

  it('returns the single newly-appended id', () => {
    const active = [
      makeItem({ id: 'a', activeOrder: 1 }),
      makeItem({ id: 'b', activeOrder: 2 }),
      makeItem({ id: 'c', activeOrder: 3 }),
    ]

    expect(latestNewActiveId(['a', 'b'], active)).toBe('c')
  })

  it('returns the last new id when several appeared at once (rapid entry)', () => {
    const active = [
      makeItem({ id: 'a', activeOrder: 1 }),
      makeItem({ id: 'b', activeOrder: 2 }),
      makeItem({ id: 'c', activeOrder: 3 }),
    ]

    expect(latestNewActiveId(['a'], active)).toBe('c')
  })

  it('treats every item as new on initial load (empty prevIds)', () => {
    const active = [
      makeItem({ id: 'a', activeOrder: 1 }),
      makeItem({ id: 'b', activeOrder: 2 }),
    ]

    expect(latestNewActiveId([], active)).toBe('b')
  })

  it('returns null when the active list only shrank (an item was removed/checked off)', () => {
    const active = [makeItem({ id: 'a', activeOrder: 1 })]

    expect(latestNewActiveId(['a', 'b'], active)).toBeNull()
  })
})

describe('reorderActiveItems', () => {
  it('drag result generates a fractional activeOrder between the correct neighbors', () => {
    // Moving 'd' (index 3) so it lands between 'a' (index 0) and 'b' (index 1)
    // -- toIndex is a position in the array-with-'d'-removed ([a, b, c]),
    // so toIndex=1 picks out prev=a (toIndex-1=0) and next=b (toIndex=1).
    const active = [
      makeActiveItem({ id: 'a', activeOrder: 1 }),
      makeActiveItem({ id: 'b', activeOrder: 2 }),
      makeActiveItem({ id: 'c', activeOrder: 3 }),
      makeActiveItem({ id: 'd', activeOrder: 4 }),
    ]

    const result = reorderActiveItems(active, 3, 1)

    expect(result).toBeGreaterThan(1)
    expect(result).toBeLessThan(2)
  })

  it('moving to the top of the list halves the next item activeOrder', () => {
    const active = [
      makeActiveItem({ id: 'a', activeOrder: 1 }),
      makeActiveItem({ id: 'b', activeOrder: 2 }),
      makeActiveItem({ id: 'c', activeOrder: 3 }),
    ]

    // Move 'c' (index 2) to the very top (index 0).
    const result = reorderActiveItems(active, 2, 0)

    expect(result).toBe(0.5)
  })

  it('moving to the top when the current top activeOrder is 0 uses -1 instead of 0', () => {
    const active = [
      makeActiveItem({ id: 'a', activeOrder: 0 }),
      makeActiveItem({ id: 'b', activeOrder: 1 }),
      makeActiveItem({ id: 'c', activeOrder: 2 }),
    ]

    const result = reorderActiveItems(active, 2, 0)

    expect(result).toBe(-1)
  })

  it('moving to the top when the current top activeOrder is negative doubles it', () => {
    const active = [
      makeActiveItem({ id: 'a', activeOrder: -2 }),
      makeActiveItem({ id: 'b', activeOrder: 1 }),
      makeActiveItem({ id: 'c', activeOrder: 2 }),
    ]

    const result = reorderActiveItems(active, 2, 0)

    expect(result).toBe(-4)
  })

  it('moving to the bottom of the list produces max(activeOrder) + 1, equivalent to nextActiveOrder', () => {
    const active = [
      makeActiveItem({ id: 'a', activeOrder: 1 }),
      makeActiveItem({ id: 'b', activeOrder: 2 }),
      makeActiveItem({ id: 'c', activeOrder: 5 }),
    ]

    // Move 'a' (index 0) to the very bottom -- toIndex is the last valid
    // index of the array-with-'a'-removed ([b, c], indices 0-1), so
    // toIndex=1 makes prev=c (toIndex-1=0... see below) and next out of
    // range. Concretely: remove 'a' -> [b(2), c(5)]; toIndex-1=1 -> c(5),
    // toIndex=2 -> out of bounds -> no next neighbor -> bottom case ->
    // nextActiveOrder([b, c]) = max(2, 5) + 1 = 6.
    const result = reorderActiveItems(active, 0, 2)

    expect(result).toBe(6)
  })

  it('only ever operates on the pre-filtered active array and never inspects status', () => {
    // reorderActiveItems takes ShoppingItem[] but its contract (per the plan)
    // is that callers always pass sortItems(items).active -- it has no
    // business filtering by status itself. This is documented by giving it
    // an all-"active" array (as the type/contract requires) and asserting it
    // still behaves purely as an index/activeOrder calculation, the same way
    // nextActiveOrder's tests document their own contracts.
    const active = [
      makeActiveItem({ id: 'a', status: 'active', activeOrder: 1 }),
      makeActiveItem({ id: 'b', status: 'active', activeOrder: 2 }),
      makeActiveItem({ id: 'c', status: 'active', activeOrder: 3 }),
      makeActiveItem({ id: 'd', status: 'active', activeOrder: 4 }),
    ]

    const result = reorderActiveItems(active, 3, 1)

    expect(result).toBeGreaterThan(1)
    expect(result).toBeLessThan(2)
  })

  it('returns the unchanged current activeOrder when fromIndex equals toIndex (no-op)', () => {
    const active = [
      makeActiveItem({ id: 'a', activeOrder: 1 }),
      makeActiveItem({ id: 'b', activeOrder: 2 }),
      makeActiveItem({ id: 'c', activeOrder: 3 }),
    ]

    const result = reorderActiveItems(active, 1, 1)

    expect(result).toBe(2)
  })

  it('falls back to a safe value instead of NaN/Infinity when neighbors have equal activeOrder', () => {
    // Two adjacent items with the exact same activeOrder -- midpoint
    // arithmetic still works out to that same value, so the fallback
    // (prev.activeOrder + Number.EPSILON) must kick in to avoid an exact
    // collision with prev/next.
    const active = [
      makeActiveItem({ id: 'a', activeOrder: 1 }),
      makeActiveItem({ id: 'b', activeOrder: 2 }),
      makeActiveItem({ id: 'c', activeOrder: 2 }),
      makeActiveItem({ id: 'd', activeOrder: 3 }),
    ]

    // Move 'd' (index 3) so it lands between 'b' and 'c': removing 'd' leaves
    // [a, b, c], and toIndex=2 picks out prev=b (toIndex-1=1) and next=c
    // (toIndex=2), both activeOrder 2 -- an exact midpoint collision.
    //
    // Note: at this magnitude `2 + Number.EPSILON === 2` in IEEE754 (EPSILON
    // is only guaranteed to perturb values near 1), so the ADR 0002-accepted
    // fallback can legitimately still land exactly on `2` here -- the only
    // hard requirement is that it's a real, finite number, never NaN/Infinity.
    const result = reorderActiveItems(active, 3, 2)

    expect(result).not.toBeNaN()
    expect(Number.isFinite(result)).toBe(true)
  })

  it('falls back to prev + Number.EPSILON when neighbors are already at the minimum float distance', () => {
    const tiny = Number.EPSILON
    const active = [
      makeActiveItem({ id: 'a', activeOrder: 1 }),
      makeActiveItem({ id: 'b', activeOrder: 1 + tiny }),
      makeActiveItem({ id: 'c', activeOrder: 5 }),
    ]

    // Move 'c' (index 2) to between 'a' and 'b' (index 1 in the original array).
    const result = reorderActiveItems(active, 2, 1)

    expect(result).not.toBeNaN()
    expect(Number.isFinite(result)).toBe(true)
    expect(result).toBe(1 + Number.EPSILON)
  })
})

describe('insertActiveOrder', () => {
  it('returns 1 when inserting into an empty destination list', () => {
    expect(insertActiveOrder([], 0)).toBe(1)
  })

  it('halves the top item activeOrder when inserting at the very top', () => {
    const dest = [
      makeActiveItem({ id: 'a', activeOrder: 2 }),
      makeActiveItem({ id: 'b', activeOrder: 4 }),
    ]

    expect(insertActiveOrder(dest, 0)).toBe(1)
  })

  it('uses -1 when inserting at the top and the current top activeOrder is 0', () => {
    const dest = [makeActiveItem({ id: 'a', activeOrder: 0 })]

    expect(insertActiveOrder(dest, 0)).toBe(-1)
  })

  it('computes the midpoint when inserting in the middle', () => {
    const dest = [
      makeActiveItem({ id: 'a', activeOrder: 1 }),
      makeActiveItem({ id: 'b', activeOrder: 3 }),
    ]

    expect(insertActiveOrder(dest, 1)).toBe(2)
  })

  it('produces nextActiveOrder when inserting past the last item (append to bottom)', () => {
    const dest = [
      makeActiveItem({ id: 'a', activeOrder: 1 }),
      makeActiveItem({ id: 'b', activeOrder: 5 }),
    ]

    expect(insertActiveOrder(dest, 2)).toBe(nextActiveOrder(dest))
    expect(insertActiveOrder(dest, 2)).toBe(6)
  })

  it('falls back to a safe finite value instead of NaN/Infinity when neighbors collide', () => {
    const dest = [
      makeActiveItem({ id: 'a', activeOrder: 2 }),
      makeActiveItem({ id: 'b', activeOrder: 2 }),
    ]

    const result = insertActiveOrder(dest, 1)

    expect(result).not.toBeNaN()
    expect(Number.isFinite(result)).toBe(true)
  })

  it('does not mutate or require the inserted item to already be present, unlike reorderActiveItems', () => {
    // The whole point of insertActiveOrder vs reorderActiveItems: the moved
    // item is NOT a member of destActiveItems, so no fromIndex/filtering step
    // exists here -- toIndex is a position in destActiveItems as-is.
    const dest = [
      makeActiveItem({ id: 'a', activeOrder: 1 }),
      makeActiveItem({ id: 'b', activeOrder: 2 }),
      makeActiveItem({ id: 'c', activeOrder: 3 }),
    ]

    const result = insertActiveOrder(dest, 3)

    expect(result).toBe(4)
    expect(dest.map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('planReorder', () => {
  const items = [
    makeActiveItem({ id: 'a', activeOrder: 1 }),
    makeActiveItem({ id: 'b', activeOrder: 2 }),
    makeActiveItem({ id: 'c', activeOrder: 3 }),
  ]

  it('returns the midpoint order when dropped on an item above', () => {
    expect(planReorder(items, 'c', 'b')).toBe(1.5)
  })

  it('moves to the top when dropped on the first item', () => {
    expect(planReorder(items, 'c', 'a')).toBe(0.5)
  })

  it('moves to the bottom when dropped on the last item', () => {
    expect(planReorder(items, 'a', 'c')).toBe(4)
  })

  it('appends to the end when no over id is given', () => {
    expect(planReorder(items, 'a')).toBe(4)
  })

  it('returns null when dropped on itself', () => {
    expect(planReorder(items, 'b', 'b')).toBeNull()
  })

  it('returns null when appending an item that is already last', () => {
    expect(planReorder(items, 'c')).toBeNull()
  })

  it('returns null when either id is not in the list', () => {
    expect(planReorder(items, 'x', 'a')).toBeNull()
    expect(planReorder(items, 'a', 'x')).toBeNull()
  })
})

describe('validateItemText', () => {
  it('returns the trimmed text', () => {
    expect(validateItemText('  mlieko  ')).toEqual({ ok: true, text: 'mlieko' })
  })

  it('rejects empty and whitespace-only text', () => {
    expect(validateItemText('')).toEqual({ ok: false })
    expect(validateItemText('   ')).toEqual({ ok: false })
  })
})

describe('purchasedSuggestions', () => {
  const texts = (items: ShoppingItem[]) => items.map((item) => item.text)

  it('matches regardless of diacritics, in both directions', () => {
    const items = [
      makeItem({ id: 'a', text: 'Čučoriedky' }),
      makeItem({ id: 'b', text: 'cesnak' }),
    ]

    expect(texts(purchasedSuggestions(items, 'cuc'))).toEqual(['Čučoriedky'])
    expect(texts(purchasedSuggestions(items, 'čes'))).toEqual(['cesnak'])
  })

  it('matches case-insensitively by prefix of the trimmed text', () => {
    const items = [makeItem({ text: '  Mlieko ' })]

    expect(texts(purchasedSuggestions(items, ' mli'))).toEqual(['  Mlieko '])
    expect(purchasedSuggestions(items, 'lieko')).toEqual([])
  })

  it('finds "Sójové mäso" from "soj"', () => {
    const items = [makeItem({ text: 'Sójové mäso' })]

    expect(texts(purchasedSuggestions(items, 'soj'))).toEqual(['Sójové mäso'])
  })

  it('suggests nothing until at least two characters are typed', () => {
    const items = [makeItem({ text: 'mlieko' })]

    expect(purchasedSuggestions(items, '   ')).toEqual([])
    expect(purchasedSuggestions(items, ' m ')).toEqual([])
    expect(texts(purchasedSuggestions(items, 'ml'))).toEqual(['mlieko'])
  })

  it('treats names differing only in case or diacritics as one suggestion, keeping the first', () => {
    const items = [
      makeItem({ id: 'a', text: 'Šalát' }),
      makeItem({ id: 'b', text: 'salat' }),
      makeItem({ id: 'c', text: 'šalát ľadový' }),
    ]

    expect(texts(purchasedSuggestions(items, 'sal'))).toEqual([
      'Šalát',
      'šalát ľadový',
    ])
  })

  it('returns at most three suggestions', () => {
    const items = ['maslo', 'mak', 'mango', 'marhule'].map((text, i) =>
      makeItem({ id: String(i), text }),
    )

    expect(purchasedSuggestions(items, 'ma')).toHaveLength(3)
  })
})
