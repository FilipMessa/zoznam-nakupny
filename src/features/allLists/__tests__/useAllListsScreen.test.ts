import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { renderHook, act } from '@testing-library/react'
import { useAllListsScreen } from '@/features/allLists/useAllListsScreen'
import { useAuth } from '@/features/auth/useAuth'
import * as itemApi from '@/features/items/itemApi'
import { notify } from '@/lib/toaster'
import type { ShoppingItem } from '@/features/items/types'
import type { ShoppingList } from '@/features/lists/types'

vi.mock('@/features/auth/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('@/features/items/itemApi', () => ({
  reorderItem: vi.fn(),
  moveItemToList: vi.fn(),
  addItem: vi.fn(),
  uncheckItem: vi.fn(),
  deleteItem: vi.fn(),
  clearDoneItems: vi.fn(),
}))
vi.mock('@/lib/toaster', () => ({ notify: vi.fn() }))

const mockedUseAuth = vi.mocked(useAuth)
const mockedReorderItem = vi.mocked(itemApi.reorderItem)
const mockedMoveItemToList = vi.mocked(itemApi.moveItemToList)
const mockedAddItem = vi.mocked(itemApi.addItem)
const mockedUncheckItem = vi.mocked(itemApi.uncheckItem)
const mockedDeleteItem = vi.mocked(itemApi.deleteItem)
const mockedClearDoneItems = vi.mocked(itemApi.clearDoneItems)
const mockedNotify = vi.mocked(notify)

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

function makeList(overrides: Partial<ShoppingList> = {}): ShoppingList {
  return {
    id: 'list-1',
    name: 'Zoznam',
    createdAt: fakeTimestamp(0),
    createdBy: 'uid-1',
    ...overrides,
  }
}

// Covers every listId this suite's fixtures reference ('list-1'/'list-2'/
// 'list-3') -- useAllListsScreen now needs `lists` for the combined Done
// section's merge and the global clear-all.
const TEST_LISTS: ShoppingList[] = [
  makeList({ id: 'list-1', name: 'Zoznam 1' }),
  makeList({ id: 'list-2', name: 'Zoznam 2' }),
  makeList({ id: 'list-3', name: 'Zoznam 3' }),
]

// Builds a minimal DragEndEvent -- only the fields useAllListsScreen's
// onDragEnd actually reads (active.id, active.data.current.listId,
// over.id, over.data.current.listId).
function makeDragEndEvent(
  activeId: string,
  activeListId: string,
  overId: string | null,
  overListId?: string,
): DragEndEvent {
  return {
    active: { id: activeId, data: { current: { listId: activeListId } } },
    over: overId
      ? {
          id: overId,
          data: { current: overListId ? { listId: overListId } : {} },
        }
      : null,
  } as unknown as DragEndEvent
}

// Builds a minimal DragStartEvent -- only the fields useAllListsScreen's
// onDragStart actually reads (active.id, active.data.current.listId).
function makeDragStartEvent(
  activeId: string,
  activeListId: string,
): DragStartEvent {
  return {
    active: { id: activeId, data: { current: { listId: activeListId } } },
  } as unknown as DragStartEvent
}

describe('useAllListsScreen', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: { uid: 'uid-1' } as never,
      authLoading: false,
    })
    mockedReorderItem.mockResolvedValue(undefined)
    mockedMoveItemToList.mockResolvedValue({ ok: true })
    mockedAddItem.mockResolvedValue('item-new')
    mockedUncheckItem.mockResolvedValue(undefined)
    mockedDeleteItem.mockResolvedValue(undefined)
    mockedClearDoneItems.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('expand/collapse', () => {
    it('starts every list expanded', () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))

      expect(result.current.isExpanded('list-1')).toBe(true)
      expect(result.current.isExpanded('list-2')).toBe(true)
    })

    it('toggleSection collapses then re-expands a list independently of others', () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))

      act(() => result.current.toggleSection('list-1'))
      expect(result.current.isExpanded('list-1')).toBe(false)
      expect(result.current.isExpanded('list-2')).toBe(true)

      act(() => result.current.toggleSection('list-1'))
      expect(result.current.isExpanded('list-1')).toBe(true)
    })
  })

  describe('draggedItem (for DragOverlay)', () => {
    it('is null before any drag starts', () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))

      expect(result.current.draggedItem).toBeNull()
    })

    it('is set to the dragged item on drag start', () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))
      const item = makeItem({ id: 'a', text: 'mlieko' })
      act(() => result.current.registerActiveItems('list-1', [item]))

      act(() =>
        result.current.handleDragStart(makeDragStartEvent('a', 'list-1')),
      )

      expect(result.current.draggedItem).toBe(item)
    })

    it('is cleared on drag end', () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))
      const item = makeItem({ id: 'a', text: 'mlieko' })
      act(() => result.current.registerActiveItems('list-1', [item]))
      act(() =>
        result.current.handleDragStart(makeDragStartEvent('a', 'list-1')),
      )
      expect(result.current.draggedItem).toBe(item)

      act(() =>
        result.current.handleDragEnd(makeDragEndEvent('a', 'list-1', null)),
      )

      expect(result.current.draggedItem).toBeNull()
    })

    it('is cleared on drag cancel', () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))
      const item = makeItem({ id: 'a', text: 'mlieko' })
      act(() => result.current.registerActiveItems('list-1', [item]))
      act(() =>
        result.current.handleDragStart(makeDragStartEvent('a', 'list-1')),
      )
      expect(result.current.draggedItem).toBe(item)

      act(() => result.current.handleDragCancel())

      expect(result.current.draggedItem).toBeNull()
    })

    it('stays null when the dragged item is not found in the registered list', () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))
      act(() =>
        result.current.registerActiveItems('list-1', [makeItem({ id: 'b' })]),
      )

      act(() =>
        result.current.handleDragStart(makeDragStartEvent('a', 'list-1')),
      )

      expect(result.current.draggedItem).toBeNull()
    })
  })

  describe('handleDragEnd — same-list reorder', () => {
    it('calls reorderItem with the fractional order computed for the drop position', () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))
      const items = [
        makeItem({ id: 'a', activeOrder: 1 }),
        makeItem({ id: 'b', activeOrder: 2 }),
        makeItem({ id: 'c', activeOrder: 3 }),
      ]
      act(() => result.current.registerActiveItems('list-1', items))

      act(() =>
        result.current.handleDragEnd(
          makeDragEndEvent('c', 'list-1', 'a', 'list-1'),
        ),
      )

      expect(mockedReorderItem).toHaveBeenCalledTimes(1)
      const [listId, itemId, order] = mockedReorderItem.mock.calls[0]
      expect(listId).toBe('list-1')
      expect(itemId).toBe('c')
      expect(order).toBeLessThan(1)
      expect(mockedMoveItemToList).not.toHaveBeenCalled()
    })

    it('does nothing when dropped on itself', () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))
      act(() =>
        result.current.registerActiveItems('list-1', [makeItem({ id: 'a' })]),
      )

      act(() =>
        result.current.handleDragEnd(
          makeDragEndEvent('a', 'list-1', 'a', 'list-1'),
        ),
      )

      expect(mockedReorderItem).not.toHaveBeenCalled()
      expect(mockedMoveItemToList).not.toHaveBeenCalled()
    })

    it('does nothing when the dragged item is no longer in the registered list', () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))
      act(() =>
        result.current.registerActiveItems('list-1', [makeItem({ id: 'b' })]),
      )

      // 'a' was checked off or deleted mid-drag -- no longer registered.
      act(() =>
        result.current.handleDragEnd(
          makeDragEndEvent('a', 'list-1', 'b', 'list-1'),
        ),
      )

      expect(mockedReorderItem).not.toHaveBeenCalled()
      expect(mockedMoveItemToList).not.toHaveBeenCalled()
    })
  })

  describe('handleDragEnd — cross-list move', () => {
    it('calls moveItemToList with the dragged item and the order computed from the destination index', () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))
      const draggedItem = makeItem({ id: 'a', activeOrder: 1 })
      act(() => {
        result.current.registerActiveItems('list-1', [draggedItem])
        result.current.registerActiveItems('list-2', [
          makeItem({ id: 'x', activeOrder: 1 }),
          makeItem({ id: 'y', activeOrder: 3 }),
        ])
      })

      act(() =>
        result.current.handleDragEnd(
          makeDragEndEvent('a', 'list-1', 'y', 'list-2'),
        ),
      )

      expect(mockedMoveItemToList).toHaveBeenCalledTimes(1)
      const [sourceListId, destListId, item, order] =
        mockedMoveItemToList.mock.calls[0]
      expect(sourceListId).toBe('list-1')
      expect(destListId).toBe('list-2')
      expect(item).toBe(draggedItem)
      expect(order).toBe(2) // midpoint between x(1) and y(3)
      expect(mockedReorderItem).not.toHaveBeenCalled()
    })

    it('appends to the end when dropped on a collapsed list header', () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))
      act(() => {
        result.current.registerActiveItems('list-1', [makeItem({ id: 'a' })])
        result.current.registerActiveItems('list-2', [
          makeItem({ id: 'x', activeOrder: 1 }),
          makeItem({ id: 'y', activeOrder: 5 }),
        ])
      })

      act(() =>
        result.current.handleDragEnd(
          makeDragEndEvent('a', 'list-1', 'list-header-list-2'),
        ),
      )

      expect(mockedMoveItemToList).toHaveBeenCalledTimes(1)
      const [, destListId, , order] = mockedMoveItemToList.mock.calls[0]
      expect(destListId).toBe('list-2')
      expect(order).toBe(6) // max(1, 5) + 1
    })

    it('inserts at order 1 when dropped on an empty list body', () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))
      act(() => {
        result.current.registerActiveItems('list-1', [makeItem({ id: 'a' })])
        result.current.registerActiveItems('list-3', [])
      })

      act(() =>
        result.current.handleDragEnd(
          makeDragEndEvent('a', 'list-1', 'list-body-list-3'),
        ),
      )

      expect(mockedMoveItemToList).toHaveBeenCalledTimes(1)
      const [, destListId, , order] = mockedMoveItemToList.mock.calls[0]
      expect(destListId).toBe('list-3')
      expect(order).toBe(1)
    })

    it('shows a toast when moveItemToList reports an expected conflict', async () => {
      mockedMoveItemToList.mockResolvedValue({
        ok: false,
        reason: 'source-missing',
      })
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))
      act(() => {
        result.current.registerActiveItems('list-1', [makeItem({ id: 'a' })])
        result.current.registerActiveItems('list-2', [])
      })

      await act(async () => {
        result.current.handleDragEnd(
          makeDragEndEvent('a', 'list-1', 'list-body-list-2'),
        )
        await Promise.resolve()
      })

      expect(mockedNotify).toHaveBeenCalledWith(
        'Položku medzičasom presunul niekto iný.',
        'error',
      )
    })

    it('shows a generic toast and logs when moveItemToList rejects', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      mockedMoveItemToList.mockRejectedValue(new Error('boom'))
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))
      act(() => {
        result.current.registerActiveItems('list-1', [makeItem({ id: 'a' })])
        result.current.registerActiveItems('list-2', [])
      })

      await act(async () => {
        result.current.handleDragEnd(
          makeDragEndEvent('a', 'list-1', 'list-body-list-2'),
        )
        await Promise.resolve()
      })

      expect(mockedNotify).toHaveBeenCalledWith(
        'Presun sa nepodarilo.',
        'error',
      )
      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })
  })

  describe('add item', () => {
    it('starts with no add target selected', () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))

      expect(result.current.addTargetListId).toBeNull()
      expect(result.current.isAddTarget('list-1')).toBe(false)
    })

    it('selectAddTarget sets the target and expands a collapsed section', () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))
      act(() => result.current.toggleSection('list-1'))
      expect(result.current.isExpanded('list-1')).toBe(false)

      act(() => result.current.selectAddTarget('list-1'))

      expect(result.current.addTargetListId).toBe('list-1')
      expect(result.current.isAddTarget('list-1')).toBe(true)
      expect(result.current.isExpanded('list-1')).toBe(true)
    })

    it('does not collapse an already-expanded section when selected as target', () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))

      act(() => result.current.selectAddTarget('list-1'))

      expect(result.current.isExpanded('list-1')).toBe(true)
    })

    it('keeps the add target selected after manually collapsing it via its chevron', () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))
      act(() => result.current.selectAddTarget('list-1'))

      act(() => result.current.toggleSection('list-1'))

      expect(result.current.isExpanded('list-1')).toBe(false)
      expect(result.current.addTargetListId).toBe('list-1')
      expect(result.current.isAddTarget('list-1')).toBe(true)
    })

    it('calls itemApi.addItem with the target list and its registered active items', async () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))
      const items = [makeItem({ id: 'a' })]
      act(() => {
        result.current.registerActiveItems('list-1', items)
        result.current.selectAddTarget('list-1')
      })

      await act(async () => {
        await result.current.handleAddItem('chlieb')
      })

      expect(mockedAddItem).toHaveBeenCalledWith(
        'list-1',
        'chlieb',
        'uid-1',
        items,
      )
    })

    it('does nothing when no add target is selected', async () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))

      await act(async () => {
        await result.current.handleAddItem('chlieb')
      })

      expect(mockedAddItem).not.toHaveBeenCalled()
    })

    it('triggers the registered scroll requester for the target list on add', async () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))
      const requestScroll = vi.fn()
      act(() => {
        result.current.registerActiveItems('list-1', [])
        result.current.registerScrollRequester('list-1', requestScroll)
        result.current.selectAddTarget('list-1')
      })

      await act(async () => {
        await result.current.handleAddItem('chlieb')
      })

      expect(requestScroll).toHaveBeenCalledTimes(1)
    })

    it('re-expands the target on add if it had been manually collapsed since selection', async () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))
      act(() => {
        result.current.selectAddTarget('list-1')
        result.current.toggleSection('list-1')
      })
      expect(result.current.isExpanded('list-1')).toBe(false)

      await act(async () => {
        await result.current.handleAddItem('chlieb')
      })

      expect(result.current.isExpanded('list-1')).toBe(true)
    })
  })

  describe('done items', () => {
    it('starts with an empty merged done list', () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))

      expect(result.current.doneItems).toEqual([])
    })

    it('merges registered done items from multiple lists sorted newest-first', () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))
      const older = makeItem({
        id: 'a',
        status: 'done',
        completedAt: fakeTimestamp(100),
      })
      const newer = makeItem({
        id: 'b',
        status: 'done',
        completedAt: fakeTimestamp(200),
      })

      act(() => {
        result.current.registerDoneItems('list-1', [older])
        result.current.registerDoneItems('list-2', [newer])
      })

      expect(result.current.doneItems.map((entry) => entry.item.id)).toEqual([
        'b',
        'a',
      ])
    })

    it('handleUncheckDone calls uncheckItem with the origin list and its registered active items', async () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))
      const activeItems = [makeItem({ id: 'x' })]
      act(() => result.current.registerActiveItems('list-1', activeItems))

      await act(async () => {
        await result.current.handleUncheckDone('list-1', 'done-1')
      })

      expect(mockedUncheckItem).toHaveBeenCalledWith(
        'list-1',
        'done-1',
        activeItems,
      )
    })

    it('handleUncheckDone re-expands the origin list if it is collapsed and triggers its scroll requester', async () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))
      const requestScroll = vi.fn()
      act(() => {
        result.current.toggleSection('list-1')
        result.current.registerScrollRequester('list-1', requestScroll)
      })
      expect(result.current.isExpanded('list-1')).toBe(false)

      await act(async () => {
        await result.current.handleUncheckDone('list-1', 'done-1')
      })

      expect(result.current.isExpanded('list-1')).toBe(true)
      expect(requestScroll).toHaveBeenCalledTimes(1)
    })

    it('handleDeleteDone calls itemApi.deleteItem with the origin list and item id', async () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))

      await act(async () => {
        await result.current.handleDeleteDone('list-2', 'done-1')
      })

      expect(mockedDeleteItem).toHaveBeenCalledWith('list-2', 'done-1')
    })

    it('handleClearAllDone calls clearDoneItems once per list', async () => {
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))

      await act(async () => {
        await result.current.handleClearAllDone()
      })

      expect(mockedClearDoneItems).toHaveBeenCalledTimes(TEST_LISTS.length)
      for (const list of TEST_LISTS) {
        expect(mockedClearDoneItems).toHaveBeenCalledWith(list.id)
      }
    })

    it('shows a toast and logs when clearing done items fails for some lists', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      mockedClearDoneItems
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce(undefined)
      const { result } = renderHook(() => useAllListsScreen(TEST_LISTS))

      await act(async () => {
        await result.current.handleClearAllDone()
      })

      expect(mockedNotify).toHaveBeenCalledWith(
        'Vyčistenie sa nepodarilo pre niektoré zoznamy.',
        'error',
      )
      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })
  })
})
