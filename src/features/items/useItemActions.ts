import { useCallback, useEffect, useRef } from 'react'
import {
  checkItem,
  uncheckItem,
  deleteItem,
  clearDoneItems,
  reorderItem,
} from './itemApi'
import type { ShoppingItem } from './types'

export interface UseItemActionsParams {
  listId: string
  uid: string
  activeItems: ShoppingItem[]
}

// A list's item writes, bound to its list (and member) so rows receive
// stable id-addressed callbacks. The one check-off point of both the
// single-list screen and each All Lists section.
export function useItemActions({
  listId,
  uid,
  activeItems,
}: UseItemActionsParams) {
  // Checking off also records the purchase under the Item's text, so the
  // handler looks the text up by id -- through a ref, so it stays stable
  // while the active items change and memoized rows don't re-render.
  const activeItemsRef = useRef(activeItems)
  useEffect(() => {
    activeItemsRef.current = activeItems
  }, [activeItems])

  const handleCheck = useCallback(
    async (itemId: string) => {
      const item = activeItemsRef.current.find(({ id }) => id === itemId)
      if (item) {
        await checkItem(listId, itemId, item.text, uid)
      }
    },
    [listId, uid],
  )

  const handleUncheck = useCallback(
    (itemId: string) => uncheckItem(listId, itemId, activeItems),
    [listId, activeItems],
  )

  const handleReorder = useCallback(
    (itemId: string, activeOrder: number) =>
      reorderItem(listId, itemId, activeOrder),
    [listId],
  )

  const handleDelete = useCallback(
    (itemId: string) => deleteItem(listId, itemId),
    [listId],
  )

  const handleClearDone = useCallback(() => clearDoneItems(listId), [listId])

  return {
    handleCheck,
    handleUncheck,
    handleReorder,
    handleDelete,
    handleClearDone,
  }
}
