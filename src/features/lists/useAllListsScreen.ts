import { useCallback, useRef, useState } from 'react'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { reorderActiveItems, insertActiveOrder } from '../items/itemLogic'
import { reorderItem, moveItemToList } from '../items/itemService'
import { moveConflictMessage } from '../items/moveConflictMessages'
import { notify } from '../../lib/toaster'
import {
  LIST_HEADER_DROPPABLE_PREFIX,
  LIST_BODY_DROPPABLE_PREFIX,
} from './components/AllListsSection'
import type { ShoppingItem } from '../items/types'

export interface UseAllListsScreenResult {
  isExpanded: (listId: string) => boolean
  toggleSection: (listId: string) => void
  registerActiveItems: (listId: string, items: ShoppingItem[]) => void
  // The item currently being dragged, for <DragOverlay> to render a
  // floating clone of -- needed because a dragged row's own useSortable
  // transform only reflects its position *within its own SortableContext*
  // (dnd-kit computes it from that context's own items array), so it stops
  // following the pointer the moment `over` leaves the row's own list.
  // Without an overlay, a cross-list drag would visually snap back to its
  // origin mid-drag even though the resulting write is still correct.
  draggedItem: ShoppingItem | null
  handleDragStart: (event: DragStartEvent) => void
  handleDragEnd: (event: DragEndEvent) => void
  handleDragCancel: () => void
}

// Resolves a drop target's destination List id, or null if `overId` isn't a
// recognised drop target at all. `undefined` toIndex means "append to the
// end" (dropped on a list's collapsed header, empty body, or past its last
// item).
function resolveDrop(
  overId: string | number,
  destItemsByListId: Map<string, ShoppingItem[]>,
  overData: Record<string, unknown> | undefined,
): { destListId: string; toIndex: number | undefined } | null {
  const overIdStr = String(overId)

  if (overIdStr.startsWith(LIST_HEADER_DROPPABLE_PREFIX)) {
    return { destListId: overIdStr.slice(LIST_HEADER_DROPPABLE_PREFIX.length), toIndex: undefined }
  }
  if (overIdStr.startsWith(LIST_BODY_DROPPABLE_PREFIX)) {
    return { destListId: overIdStr.slice(LIST_BODY_DROPPABLE_PREFIX.length), toIndex: undefined }
  }

  // Otherwise `over` is an item row -- its sortableData carries the list it
  // belongs to (see ActiveItemRow's sortableData prop / AllListsSection).
  const destListId = overData?.listId
  if (typeof destListId !== 'string') {
    return null
  }
  const destItems = destItemsByListId.get(destListId) ?? []
  const index = destItems.findIndex((item) => item.id === overIdStr)
  return { destListId, toIndex: index === -1 ? undefined : index }
}

// All sections start expanded -- this screen's whole purpose is moving
// items *between* lists, so requiring a manual expand step before a
// cross-list drag is even possible would work against that. Collapsing a
// section is a purely opt-in way to reduce clutter, not persisted across
// screen opens (a fresh Set every time this hook mounts).
export function useAllListsScreen(): UseAllListsScreenResult {
  const [collapsedListIds, setCollapsedListIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [draggedItem, setDraggedItem] = useState<ShoppingItem | null>(null)

  // Each AllListsSection reports its own current active items here on every
  // render -- the shared DndContext lives above all the sections, so its
  // onDragEnd needs synchronous read access to every list's items to
  // compute a drop's destination order, something no single section's own
  // useItems subscription has on its own. A ref (not state) because writes
  // happen on every section render and must never themselves trigger a
  // re-render of this hook's owner.
  const activeItemsByListId = useRef<Map<string, ShoppingItem[]>>(new Map())

  const registerActiveItems = useCallback((listId: string, items: ShoppingItem[]) => {
    activeItemsByListId.current.set(listId, items)
  }, [])

  const isExpanded = (listId: string) => !collapsedListIds.has(listId)

  const toggleSection = (listId: string) => {
    setCollapsedListIds((prev) => {
      const next = new Set(prev)
      if (next.has(listId)) {
        next.delete(listId)
      } else {
        next.add(listId)
      }
      return next
    })
  }

  const handleDragStart = (event: DragStartEvent) => {
    const listId = event.active.data.current?.listId
    if (typeof listId !== 'string') {
      return
    }
    const items = activeItemsByListId.current.get(listId) ?? []
    setDraggedItem(items.find((item) => item.id === event.active.id) ?? null)
  }

  const handleDragCancel = () => {
    setDraggedItem(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedItem(null)

    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const sourceListId = active.data.current?.listId
    if (typeof sourceListId !== 'string') {
      return
    }
    const sourceItems = activeItemsByListId.current.get(sourceListId) ?? []
    const draggedItem = sourceItems.find((item) => item.id === active.id)
    if (!draggedItem) {
      // The item vanished from this section between the drag starting and
      // ending (e.g. it was checked off or deleted by another Member
      // mid-drag) -- nothing sane to write.
      return
    }

    const drop = resolveDrop(over.id, activeItemsByListId.current, over.data.current)
    if (!drop) {
      return
    }
    const { destListId, toIndex } = drop

    if (destListId === sourceListId) {
      const fromIndex = sourceItems.findIndex((item) => item.id === active.id)
      const resolvedToIndex = toIndex ?? sourceItems.length - 1
      if (fromIndex === resolvedToIndex) {
        return
      }
      const newOrder = reorderActiveItems(sourceItems, fromIndex, resolvedToIndex)
      reorderItem(sourceListId, String(active.id), newOrder).catch((error: unknown) => {
        console.error('Failed to reorder item', error)
        notify('Preusporiadanie sa nepodarilo.', 'error')
      })
      return
    }

    const destItems = activeItemsByListId.current.get(destListId) ?? []
    const resolvedToIndex = toIndex ?? destItems.length
    const newOrder = insertActiveOrder(destItems, resolvedToIndex)

    moveItemToList(sourceListId, destListId, draggedItem, newOrder)
      .then((result) => {
        if (!result.ok) {
          notify(moveConflictMessage(result.reason), 'error')
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to move item between lists', error)
        notify('Presun sa nepodarilo.', 'error')
      })
  }

  return {
    isExpanded,
    toggleSection,
    registerActiveItems,
    draggedItem,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  }
}
