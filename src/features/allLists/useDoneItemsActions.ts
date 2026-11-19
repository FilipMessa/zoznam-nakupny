import { useCallback } from 'react'
import {
  clearDoneItems,
  deleteItem,
  uncheckItem,
} from '@/features/items/itemApi'
import { notify } from '@/lib/toaster'
import { CLEAR_DONE_FAILED_MESSAGE } from './allListsService'
import type { ItemRegistry } from './useItemRegistry'
import type { ShoppingList } from '@/features/lists/types'

// Actions of the combined Done section, each addressed by the done item's
// origin list.
export function useDoneItemsActions({
  lists,
  getActiveItems,
  requestScroll,
  expandIfCollapsed,
}: {
  lists: ShoppingList[]
  getActiveItems: ItemRegistry['getActiveItems']
  requestScroll: ItemRegistry['requestScroll']
  expandIfCollapsed: (listId: string) => void
}) {
  const handleUncheckDone = useCallback(
    async (listId: string, itemId: string) => {
      requestScroll(listId)
      expandIfCollapsed(listId)
      await uncheckItem(listId, itemId, getActiveItems(listId))
    },
    [requestScroll, expandIfCollapsed, getActiveItems],
  )

  const handleDeleteDone = useCallback(
    async (listId: string, itemId: string) => {
      await deleteItem(listId, itemId)
    },
    [],
  )

  const handleClearAllDone = useCallback(async () => {
    const results = await Promise.allSettled(
      lists.map((list) => clearDoneItems(list.id)),
    )
    const hasFailure = results.some((result) => result.status === 'rejected')
    if (hasFailure) {
      console.error('Failed to clear done items for one or more lists', results)
      notify(CLEAR_DONE_FAILED_MESSAGE, 'error')
    }
  }, [lists])

  return { handleUncheckDone, handleDeleteDone, handleClearAllDone }
}
