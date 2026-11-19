import { useEffect, useMemo } from 'react'
import type { RefObject } from 'react'
import { useAuth } from '@/features/auth/useAuth'
import { useItems } from '@/features/items/useItems'
import { sortItems } from '@/features/items/itemService'
import { useItemActions } from '@/features/items/useItemActions'
import { useItemEditing } from '@/features/items/useItemEditing'
import { useSwipeRowRegistry } from '@/features/items/useSwipeRowRegistry'
import { useScrollNewItemIntoView } from '@/features/items/useScrollNewItemIntoView'
import { listColorFor } from '@/features/allLists/allListsService'
import type { ShoppingItem } from '@/features/items/types'

export interface UseAllListsSectionParams {
  listId: string
  // Reports this section's current active items up to the shared
  // DndContext's onDragEnd handler (in useAllListsScreen), which needs
  // synchronous read access to every list's items to compute a drop's
  // destination order and resolve the dragged item's full record -- data
  // that only exists inside each section's own useItems subscription.
  onActiveItemsChange: (listId: string, items: ShoppingItem[]) => void
  // Reports this section's done items up for the combined Done section at
  // the bottom of the screen -- done items are never rendered inside the
  // section itself.
  onDoneItemsChange: (listId: string, items: ShoppingItem[]) => void
  onRegisterScrollRequester: (listId: string, requestScroll: () => void) => void
  // One shared container for the whole screen, not per section.
  mainScrollRef: RefObject<HTMLElement | null>
}

// Everything one AllListsSection needs besides its props. Each section owns
// its own useItems subscription: React's rules of hooks rule out fanning
// these out via a loop in a single parent hook, since the number of lists
// can change while the screen is open -- one useItems call per section
// instance (keyed by list.id in the parent's map) is the only correct way.
export function useAllListsSection({
  listId,
  onActiveItemsChange,
  onDoneItemsChange,
  onRegisterScrollRequester,
  mainScrollRef,
}: UseAllListsSectionParams) {
  const { user } = useAuth()
  const { items } = useItems(listId)
  // Memoized on `items` so the report-up effects below only fire when the
  // subscription actually delivered new data.
  const { active, done } = useMemo(() => sortItems(items), [items])
  const listColor = listColorFor(listId)

  useEffect(() => {
    onActiveItemsChange(listId, active)
  }, [listId, active, onActiveItemsChange])

  useEffect(() => {
    onDoneItemsChange(listId, done)
  }, [listId, done, onDoneItemsChange])

  const { requestScrollAfterAdd } = useScrollNewItemIntoView(
    active,
    mainScrollRef,
  )

  useEffect(() => {
    onRegisterScrollRequester(listId, requestScrollAfterAdd)
  }, [listId, requestScrollAfterAdd, onRegisterScrollRequester])

  const { openSwipeItemId, handleSwipeOpenChange, handleListScroll } =
    useSwipeRowRegistry()
  const { editingItemId, handleStartEdit, handleSubmitEdit, handleCancelEdit } =
    useItemEditing(listId)
  const { handleCheck, handleDelete } = useItemActions({
    listId,
    uid: user?.uid ?? null,
    activeItems: active,
  })

  // Stabilized so ActiveItemRow.memo isn't defeated by a new object literal
  // every render (dnd-kit attaches this to the shared DndContext's
  // active.data.current, read in useAllListsScreen's onDragEnd).
  const sortableData = useMemo(() => ({ listId }), [listId])
  // Same reasoning for @dnd-kit/sortable's own internal memoization, which
  // is keyed on this array's identity.
  const sortableIds = useMemo(() => active.map((item) => item.id), [active])

  return {
    active,
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
