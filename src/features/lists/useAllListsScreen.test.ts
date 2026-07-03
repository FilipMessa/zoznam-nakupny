import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { renderHook, act } from '@testing-library/react'
import { useAllListsScreen } from './useAllListsScreen'
import * as itemService from '../items/itemService'
import { notify } from '../../lib/toaster'
import type { ShoppingItem } from '../items/types'

vi.mock('../items/itemService', () => ({
  reorderItem: vi.fn(),
  moveItemToList: vi.fn(),
}))
vi.mock('../../lib/toaster', () => ({ notify: vi.fn() }))

const mockedReorderItem = vi.mocked(itemService.reorderItem)
const mockedMoveItemToList = vi.mocked(itemService.moveItemToList)
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
      ? { id: overId, data: { current: overListId ? { listId: overListId } : {} } }
      : null,
  } as unknown as DragEndEvent
}

// Builds a minimal DragStartEvent -- only the fields useAllListsScreen's
// onDragStart actually reads (active.id, active.data.current.listId).
function makeDragStartEvent(activeId: string, activeListId: string): DragStartEvent {
  return {
    active: { id: activeId, data: { current: { listId: activeListId } } },
  } as unknown as DragStartEvent
}

describe('useAllListsScreen', () => {
  beforeEach(() => {
    mockedReorderItem.mockResolvedValue(undefined)
    mockedMoveItemToList.mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('expand/collapse', () => {
    it('starts every list expanded', () => {
      const { result } = renderHook(() => useAllListsScreen())

      expect(result.current.isExpanded('list-1')).toBe(true)
      expect(result.current.isExpanded('list-2')).toBe(true)
    })

    it('toggleSection collapses then re-expands a list independently of others', () => {
      const { result } = renderHook(() => useAllListsScreen())

      act(() => result.current.toggleSection('list-1'))
      expect(result.current.isExpanded('list-1')).toBe(false)
      expect(result.current.isExpanded('list-2')).toBe(true)

      act(() => result.current.toggleSection('list-1'))
      expect(result.current.isExpanded('list-1')).toBe(true)
    })
  })

  describe('draggedItem (for DragOverlay)', () => {
    it('is null before any drag starts', () => {
      const { result } = renderHook(() => useAllListsScreen())

      expect(result.current.draggedItem).toBeNull()
    })

    it('is set to the dragged item on drag start', () => {
      const { result } = renderHook(() => useAllListsScreen())
      const item = makeItem({ id: 'a', text: 'mlieko' })
      act(() => result.current.registerActiveItems('list-1', [item]))

      act(() => result.current.handleDragStart(makeDragStartEvent('a', 'list-1')))

      expect(result.current.draggedItem).toBe(item)
    })

    it('is cleared on drag end', () => {
      const { result } = renderHook(() => useAllListsScreen())
      const item = makeItem({ id: 'a', text: 'mlieko' })
      act(() => result.current.registerActiveItems('list-1', [item]))
      act(() => result.current.handleDragStart(makeDragStartEvent('a', 'list-1')))
      expect(result.current.draggedItem).toBe(item)

      act(() =>
        result.current.handleDragEnd(makeDragEndEvent('a', 'list-1', null)),
      )

      expect(result.current.draggedItem).toBeNull()
    })

    it('is cleared on drag cancel', () => {
      const { result } = renderHook(() => useAllListsScreen())
      const item = makeItem({ id: 'a', text: 'mlieko' })
      act(() => result.current.registerActiveItems('list-1', [item]))
      act(() => result.current.handleDragStart(makeDragStartEvent('a', 'list-1')))
      expect(result.current.draggedItem).toBe(item)

      act(() => result.current.handleDragCancel())

      expect(result.current.draggedItem).toBeNull()
    })

    it('stays null when the dragged item is not found in the registered list', () => {
      const { result } = renderHook(() => useAllListsScreen())
      act(() => result.current.registerActiveItems('list-1', [makeItem({ id: 'b' })]))

      act(() => result.current.handleDragStart(makeDragStartEvent('a', 'list-1')))

      expect(result.current.draggedItem).toBeNull()
    })
  })

  describe('handleDragEnd — same-list reorder', () => {
    it('calls reorderItem with the fractional order computed for the drop position', () => {
      const { result } = renderHook(() => useAllListsScreen())
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
      const { result } = renderHook(() => useAllListsScreen())
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
      const { result } = renderHook(() => useAllListsScreen())
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
      const { result } = renderHook(() => useAllListsScreen())
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
      const { result } = renderHook(() => useAllListsScreen())
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
      const { result } = renderHook(() => useAllListsScreen())
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
      mockedMoveItemToList.mockResolvedValue({ ok: false, reason: 'source-missing' })
      const { result } = renderHook(() => useAllListsScreen())
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
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockedMoveItemToList.mockRejectedValue(new Error('boom'))
      const { result } = renderHook(() => useAllListsScreen())
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

      expect(mockedNotify).toHaveBeenCalledWith('Presun sa nepodarilo.', 'error')
      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })
  })
})
