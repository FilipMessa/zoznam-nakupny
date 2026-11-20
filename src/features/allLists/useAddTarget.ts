import { useCallback, useState } from 'react'
import { useAddItemSubmit } from '@/features/items/useAddItemSubmit'
import { usePurchaseSuggestions } from '@/features/items/usePurchaseSuggestions'
import type { ShoppingItem } from '@/features/items/types'

const NO_ITEMS: ShoppingItem[] = []

// Which list the bottom "add item" form writes to. Deliberately separate
// from the collapsed-sections state -- collapsing the target via its chevron
// must not clear the selection.
export function useAddTarget({
  uid,
  activeItemsOf,
  doneItemsOf,
  requestScroll,
  expandIfCollapsed,
}: {
  uid: string
  activeItemsOf: (listId: string) => ShoppingItem[]
  doneItemsOf: (listId: string) => ShoppingItem[]
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

  const activeItems = addTargetListId
    ? activeItemsOf(addTargetListId)
    : NO_ITEMS

  // Same submit as the single-list screen; landing in a collapsed target
  // re-expands it so the user sees the item arrive.
  const { addError, handleAdd } = useAddItemSubmit({
    listId: addTargetListId,
    uid,
    activeItems,
    doneItems: addTargetListId ? doneItemsOf(addTargetListId) : NO_ITEMS,
    onAddStart: (listId) => {
      requestScroll(listId)
      expandIfCollapsed(listId)
    },
  })

  // Suggestions follow the Add Target: its own purchases rank first and its
  // active Items aren't suggested.
  const suggest = usePurchaseSuggestions(addTargetListId, activeItems)

  return {
    addTargetListId,
    isAddTarget,
    selectAddTarget,
    addError,
    handleAdd,
    suggest,
  }
}
