import { describe, it, expect } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import {
  listColorFor,
  LIST_COLOR_PALETTE,
  mergeDoneItems,
  moveConflictMessage,
  toggleCollapsed,
  expandListId,
  resolveDrop,
  planDragEnd,
  LIST_HEADER_DROPPABLE_PREFIX,
  LIST_BODY_DROPPABLE_PREFIX,
} from '@/features/allLists/allListsService'
import type { ShoppingItem } from '@/features/items/types'

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

function done(items: ShoppingItem[]) {
  return { active: [], done: items }
}

describe('mergeDoneItems', () => {
  it('returns an empty array when there are no lists or no done items', () => {
    expect(mergeDoneItems(new Map())).toEqual([])
    expect(mergeDoneItems(new Map([['list-1', done([])]]))).toEqual([])
  })

  it('tags each item with its origin listId', () => {
    const item = makeItem({ id: 'a' })

    const result = mergeDoneItems(new Map([['list-1', done([item])]]))

    expect(result).toEqual([{ item, listId: 'list-1' }])
  })

  it('merges done items from multiple lists sorted by completedAt descending', () => {
    const a = makeItem({ id: 'a', completedAt: fakeTimestamp(100) })
    const b = makeItem({ id: 'b', completedAt: fakeTimestamp(300) })
    const c = makeItem({ id: 'c', completedAt: fakeTimestamp(200) })
    const itemsByList = new Map([
      ['list-1', done([a])],
      ['list-2', done([b, c])],
    ])

    const result = mergeDoneItems(itemsByList)

    expect(result.map((entry) => entry.item.id)).toEqual(['b', 'c', 'a'])
  })

  it('keeps list order for items completed at the same time', () => {
    const a = makeItem({ id: 'a', completedAt: null })
    const b = makeItem({ id: 'b', completedAt: null })
    const itemsByList = new Map([
      ['list-2', done([b])],
      ['list-1', done([a])],
    ])

    expect(mergeDoneItems(itemsByList).map((entry) => entry.item.id)).toEqual([
      'b',
      'a',
    ])
  })
})

describe('listColorFor', () => {
  it('returns the same color for the same list id every time', () => {
    const first = listColorFor('list-abc')
    const second = listColorFor('list-abc')

    expect(second).toEqual(first)
  })

  it('returns a token pair from the fixed palette', () => {
    const color = listColorFor('list-xyz')
    const hue = color.solid.split('.')[0]

    expect(LIST_COLOR_PALETTE).toContain(hue)
    expect(color).toEqual({ solid: `${hue}.solid`, subtle: `${hue}.subtle` })
  })

  it('spreads different ids across more than one palette color', () => {
    const ids = ['list-a', 'list-b', 'list-c', 'list-d', 'list-e', 'list-f']
    const colors = new Set(ids.map((id) => listColorFor(id).solid))

    expect(colors.size).toBeGreaterThan(1)
  })
})

describe('moveConflictMessage', () => {
  it('returns a Slovak message for source-missing', () => {
    expect(moveConflictMessage('source-missing')).toBe(
      'Položku medzičasom presunul niekto iný.',
    )
  })

  it('returns a Slovak message for dest-list-missing', () => {
    expect(moveConflictMessage('dest-list-missing')).toBe(
      'Cieľový zoznam už neexistuje.',
    )
  })

  it('returns a distinct message per reason', () => {
    expect(moveConflictMessage('source-missing')).not.toBe(
      moveConflictMessage('dest-list-missing'),
    )
  })
})

describe('toggleCollapsed / expandListId', () => {
  it('toggleCollapsed adds then removes an id without mutating the input', () => {
    const empty = new Set<string>()
    const collapsed = toggleCollapsed(empty, 'a')
    expect([...collapsed]).toEqual(['a'])
    expect(empty.size).toBe(0)
    expect([...toggleCollapsed(collapsed, 'a')]).toEqual([])
  })

  it('expandListId removes a collapsed id', () => {
    expect([...expandListId(new Set(['a', 'b']), 'a')]).toEqual(['b'])
  })

  it('expandListId returns the same Set when the id is not collapsed', () => {
    const collapsed = new Set(['b'])
    expect(expandListId(collapsed, 'a')).toBe(collapsed)
  })
})

describe('resolveDrop', () => {
  const items = new Map([
    ['list-2', [makeItem({ id: 'x' }), makeItem({ id: 'y' })]],
  ])

  it('resolves a header drop target to an append on that list', () => {
    expect(
      resolveDrop(`${LIST_HEADER_DROPPABLE_PREFIX}list-2`, items, undefined),
    ).toEqual({ destListId: 'list-2', toIndex: undefined })
  })

  it('resolves an empty-body drop target to an append on that list', () => {
    expect(
      resolveDrop(`${LIST_BODY_DROPPABLE_PREFIX}list-3`, items, undefined),
    ).toEqual({ destListId: 'list-3', toIndex: undefined })
  })

  it('resolves an item row to its list and index', () => {
    expect(resolveDrop('y', items, { listId: 'list-2' })).toEqual({
      destListId: 'list-2',
      toIndex: 1,
    })
  })

  it('appends when the item row is not found in its list', () => {
    expect(resolveDrop('gone', items, { listId: 'list-2' })).toEqual({
      destListId: 'list-2',
      toIndex: undefined,
    })
  })

  it('returns null for an unrecognised target without list data', () => {
    expect(resolveDrop('y', items, undefined)).toBeNull()
    expect(resolveDrop('y', items, { listId: 5 })).toBeNull()
  })
})

describe('planDragEnd', () => {
  const a = makeItem({ id: 'a', status: 'active', activeOrder: 1 })
  const b = makeItem({ id: 'b', status: 'active', activeOrder: 2 })
  const c = makeItem({ id: 'c', status: 'active', activeOrder: 3 })
  const x = makeItem({ id: 'x', status: 'active', activeOrder: 10 })
  const byList = new Map([
    ['list-1', [a, b, c]],
    ['list-2', [x]],
    ['list-3', []],
  ])
  const base = { activeItemsByListId: byList, activeListId: 'list-1' }

  it('does nothing without a drop target', () => {
    expect(planDragEnd({ ...base, activeId: 'a', over: null })).toEqual({
      type: 'none',
    })
  })

  it('does nothing when dropped on itself', () => {
    expect(
      planDragEnd({
        ...base,
        activeId: 'a',
        over: { id: 'a', data: { listId: 'list-1' } },
      }),
    ).toEqual({ type: 'none' })
  })

  it('does nothing when the source list id is not a string', () => {
    expect(
      planDragEnd({
        ...base,
        activeListId: undefined,
        activeId: 'a',
        over: { id: 'b', data: { listId: 'list-1' } },
      }),
    ).toEqual({ type: 'none' })
  })

  it('does nothing when the dragged item vanished from its list', () => {
    expect(
      planDragEnd({
        ...base,
        activeId: 'gone',
        over: { id: 'b', data: { listId: 'list-1' } },
      }),
    ).toEqual({ type: 'none' })
  })

  it('does nothing when the drop target is unrecognised', () => {
    expect(
      planDragEnd({
        ...base,
        activeId: 'a',
        over: { id: 'b', data: undefined },
      }),
    ).toEqual({ type: 'none' })
  })

  it('plans a reorder within the same list (moving to the end appends after the last order)', () => {
    expect(
      planDragEnd({
        ...base,
        activeId: 'a',
        over: { id: 'c', data: { listId: 'list-1' } },
      }),
    ).toEqual({
      type: 'reorder',
      listId: 'list-1',
      itemId: 'a',
      newOrder: 4,
    })
  })

  it('does nothing when the reorder lands on the same index', () => {
    expect(
      planDragEnd({
        ...base,
        activeId: 'c',
        over: { id: `${LIST_HEADER_DROPPABLE_PREFIX}list-1`, data: undefined },
      }),
    ).toEqual({ type: 'none' })
  })

  it('plans a cross-list move to the dropped index', () => {
    expect(
      planDragEnd({
        ...base,
        activeId: 'a',
        over: { id: 'x', data: { listId: 'list-2' } },
      }),
    ).toEqual({
      type: 'move',
      sourceListId: 'list-1',
      destListId: 'list-2',
      item: a,
      newOrder: 5,
    })
  })

  it('appends to the end when moved onto another list header', () => {
    const plan = planDragEnd({
      ...base,
      activeId: 'a',
      over: { id: `${LIST_HEADER_DROPPABLE_PREFIX}list-2`, data: undefined },
    })
    expect(plan).toMatchObject({ type: 'move', destListId: 'list-2' })
    expect((plan as { newOrder: number }).newOrder).toBeGreaterThan(10)
  })

  it('plans a move into an empty list body', () => {
    expect(
      planDragEnd({
        ...base,
        activeId: 'a',
        over: { id: `${LIST_BODY_DROPPABLE_PREFIX}list-3`, data: undefined },
      }),
    ).toMatchObject({ type: 'move', destListId: 'list-3', newOrder: 1 })
  })
})
