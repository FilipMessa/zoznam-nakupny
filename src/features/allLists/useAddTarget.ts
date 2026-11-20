import { useCallback, useState } from 'react'
import { useAddItemSubmit } from '@/features/items/useAddItemSubmit'
import type { ShoppingItem } from '@/features/items/types'

// Which list the bottom "add item" form writes to. Deliberately separate
// from the collapsed-sections state -- collapsing the target via its chevron
// must not clear the selection.
export function useAddTarget({
  uid,
  activeItemsOf,
  requestScroll,
  expandIfCollapsed,
}: {
  uid: string
  activeItemsOf: (listId: string) => ShoppingItem[]
  requestScroll: (listId: string) => void
  expandIfCollapsed: (listId: string) => void
}) {
  const [addTargetListId, setAddTargetListId] = useState<string | null>(null)

  const isAddTarget = useCallback(
    (listId: string) => addTargetListId === listId,
    [addTargetListId],
  )

  const selectAddTarget = useCallback(
    (listId: string) => {
      setAddTargetListId(listId)
      expandIfCollapsed(listId)
    },
    [expandIfCollapsed],
  )

  // Same submit as the single-list screen; landing in a collapsed target
  // re-expands it so the user sees the item arrive.
  const { addError, handleAdd } = useAddItemSubmit({
    listId: addTargetListId,
    uid,
    activeItems: addTargetListId ? activeItemsOf(addTargetListId) : [],
    onAddStart: (listId) => {
      requestScroll(listId)
      expandIfCollapsed(listId)
    },
  })

  return {
    addTargetListId,
    isAddTarget,
    selectAddTarget,
    addError,
    handleAdd,
  }
}
