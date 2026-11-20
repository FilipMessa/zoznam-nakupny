import { useCallback } from 'react'
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

// The single-list screen's item writes, bound to its list (and member) so
// rows receive stable id-addressed callbacks.
export function useItemActions({
  listId,
  uid,
  activeItems,
}: UseItemActionsParams) {
  const handleCheck = useCallback(
    (itemId: string) => checkItem(listId, itemId, uid),
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
