import { useCallback, useMemo } from 'react'
import {
  clearDoneItems,
  deleteItem,
  uncheckItem,
} from '@/features/items/itemApi'
import { notify } from '@/lib/toaster'
import {
  CLEAR_DONE_FAILED_MESSAGE,
  type DoneItemWithOrigin,
} from './allListsService'
import type { ShoppingItem } from '@/features/items/types'
import type { ShoppingList } from '@/features/lists/types'

// Actions of the combined Done section. Rows are addressed by item id alone
// (so the handlers can be passed down stable); the origin list is looked up
// from the merged done items.
export function useDoneItemsActions({
  lists,
  doneItems,
  activeItemsOf,
  requestScroll,
  expandIfCollapsed,
}: {
  lists: ShoppingList[]
  doneItems: DoneItemWithOrigin[]
  activeItemsOf: (listId: string) => ShoppingItem[]
  requestScroll: (listId: string) => void
  expandIfCollapsed: (listId: string) => void
}) {
  const originListIds = useMemo(
    () => new Map(doneItems.map(({ item, listId }) => [item.id, listId])),
    [doneItems],
  )

  const handleUncheckDone = useCallback(
    async (itemId: string) => {
      const listId = originListIds.get(itemId)
      if (listId === undefined) {
        return
      }
      requestScroll(listId)
      expandIfCollapsed(listId)
      await uncheckItem(listId, itemId, activeItemsOf(listId))
    },
    [originListIds, requestScroll, expandIfCollapsed, activeItemsOf],
  )

  const handleDeleteDone = useCallback(
    async (itemId: string) => {
      const listId = originListIds.get(itemId)
      if (listId !== undefined) {
        await deleteItem(listId, itemId)
      }
    },
    [originListIds],
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
