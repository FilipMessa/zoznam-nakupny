import { useCallback, useState } from 'react'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { moveItemToList, reorderItem } from '@/features/items/itemApi'
import { notify } from '@/lib/toaster'
import {
  MOVE_FAILED_MESSAGE,
  REORDER_FAILED_MESSAGE,
  moveConflictMessage,
  planDragEnd,
} from './allListsService'
import type { ShoppingItem } from '@/features/items/types'

// Drag-and-drop orchestration for the shared DndContext: tracks the dragged
// item for <DragOverlay> and turns a finished drag into the right write
// (single-document fractional reorder within a list, or the transactional
// cross-list move -- ADR 0003).
export function useAllListsDrag(
  activeItemsByList: ReadonlyMap<string, ShoppingItem[]>,
) {
  // The item currently being dragged, for <DragOverlay> to render a
  // floating clone of -- needed because a dragged row's own useSortable
  // transform only reflects its position *within its own SortableContext*
  // (dnd-kit computes it from that context's own items array), so it stops
  // following the pointer the moment `over` leaves the row's own list.
  // Without an overlay, a cross-list drag would visually snap back to its
  // origin mid-drag even though the resulting write is still correct.
  const [draggedItem, setDraggedItem] = useState<ShoppingItem | null>(null)

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const listId = event.active.data.current?.listId
      if (typeof listId !== 'string') {
        return
      }
      const items = activeItemsByList.get(listId) ?? []
      setDraggedItem(items.find((item) => item.id === event.active.id) ?? null)
    },
    [activeItemsByList],
  )

  const handleDragCancel = useCallback(() => {
    setDraggedItem(null)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggedItem(null)

      const { active, over } = event
      const plan = planDragEnd({
        activeId: active.id,
        activeListId: active.data.current?.listId,
        over: over ? { id: over.id, data: over.data.current } : null,
        activeItemsByListId: activeItemsByList,
      })

      if (plan.type === 'reorder') {
        reorderItem(plan.listId, plan.itemId, plan.newOrder).catch(
          (error: unknown) => {
            console.error('Failed to reorder item', error)
            notify(REORDER_FAILED_MESSAGE, 'error')
          },
        )
      } else if (plan.type === 'move') {
        moveItemToList(
          plan.sourceListId,
          plan.destListId,
          plan.item,
          plan.newOrder,
        )
          .then((result) => {
            if (!result.ok) {
              notify(moveConflictMessage(result.reason), 'error')
            }
          })
          .catch((error: unknown) => {
            console.error('Failed to move item between lists', error)
            notify(MOVE_FAILED_MESSAGE, 'error')
          })
      }
    },
    [activeItemsByList],
  )

  return { draggedItem, handleDragStart, handleDragEnd, handleDragCancel }
}
