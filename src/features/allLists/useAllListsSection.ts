import { useMemo } from 'react'
import { useAuth } from '@/features/auth/useAuth'
import { useItemActions } from '@/features/items/useItemActions'
import { useItemEditing } from '@/features/items/useItemEditing'
import { useSwipeRowRegistry } from '@/features/items/useSwipeRowRegistry'
import { listColorFor } from './allListsService'
import type { ShoppingItem } from '@/features/items/types'

// Per-list wiring of one AllListsSection: row actions bound to this list,
// its edit and swipe state, and the stable dnd-kit inputs. The items
// themselves come from the screen (useAllListsScreen subscribes to every
// list once).
export function useAllListsSection(
  listId: string,
  activeItems: ShoppingItem[],
) {
  const { user } = useAuth()
  const listColor = listColorFor(listId)

  const { openSwipeItemId, handleSwipeOpenChange, handleListScroll } =
    useSwipeRowRegistry()
  const { editingItemId, handleStartEdit, handleSubmitEdit, handleCancelEdit } =
    useItemEditing(listId)
  const { handleCheck, handleDelete } = useItemActions({
    listId,
    uid: user?.uid ?? null,
    activeItems,
  })

  // Stabilized so ActiveItemRow.memo isn't defeated by a new object literal
  // every render (dnd-kit attaches this to the shared DndContext's
  // active.data.current, read in useAllListsDrag's handleDragEnd).
  const sortableData = useMemo(() => ({ listId }), [listId])
  // Same reasoning for @dnd-kit/sortable's own internal memoization, which
  // is keyed on this array's identity.
  const sortableIds = useMemo(
    () => activeItems.map((item) => item.id),
    [activeItems],
  )

  return {
    listColor,
    sortableData,
    sortableIds,
    openSwipeItemId,
    handleSwipeOpenChange,
    handleListScroll,
    editingItemId,
    handleStartEdit,
    handleSubmitEdit,
    handleCancelEdit,
    handleCheck,
    handleDelete,
  }
}
