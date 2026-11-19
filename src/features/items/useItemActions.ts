import { useCallback } from 'react'
import type { User } from 'firebase/auth'
import {
  checkItem,
  uncheckItem,
  deleteItem,
  clearDoneItems,
  reorderItem,
} from './itemService'
import type { ShoppingItem } from './types'

export interface UseItemActionsParams {
  listId: string
  user: User | null
  activeItems: ShoppingItem[]
}

export interface UseItemActionsResult {
  handleCheck: (itemId: string) => Promise<void>
  handleUncheck: (itemId: string) => Promise<void>
  handleReorder: (itemId: string, activeOrder: number) => Promise<void>
  handleDelete: (itemId: string) => Promise<void>
  handleClearDone: () => Promise<void>
}

export function useItemActions({
  listId,
  user,
  activeItems,
}: UseItemActionsParams): UseItemActionsResult {
  const handleCheck = useCallback(
    async (itemId: string) => {
      if (!user) {
        return
      }
      await checkItem(listId, itemId, user.uid)
    },
    [listId, user],
  )

  const handleUncheck = useCallback(
    async (itemId: string) => {
      await uncheckItem(listId, itemId, activeItems)
    },
    [listId, activeItems],
  )

  const handleReorder = useCallback(
    async (itemId: string, activeOrder: number) => {
      await reorderItem(listId, itemId, activeOrder)
    },
    [listId],
  )

  const handleDelete = useCallback(
    async (itemId: string) => {
      await deleteItem(listId, itemId)
    },
    [listId],
  )

  const handleClearDone = useCallback(async () => {
    await clearDoneItems(listId)
  }, [listId])

  return {
    handleCheck,
    handleUncheck,
    handleReorder,
    handleDelete,
    handleClearDone,
  }
}
