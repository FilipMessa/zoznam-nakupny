import { useState } from 'react'
import { useAuth } from '@/features/auth/useAuth'
import { addItem, uncheckItem } from './itemApi'
import type { AddItemError, ShoppingItem } from './types'

export interface UseAddItemSubmitParams {
  // null while there's nowhere to add to yet (the All Lists screen before a
  // target list is picked) -- submitting is then a no-op.
  listId: string | null
  uid: string
  activeItems: ShoppingItem[]
  onAddStart: (listId: string) => void
}

export interface UseAddItemSubmitResult {
  addError: AddItemError | null
  handleAdd: (item: string | ShoppingItem) => Promise<void>
}

export function useAddItemSubmit({
  listId,
  uid,
  activeItems,
  onAddStart,
}: UseAddItemSubmitParams): UseAddItemSubmitResult {
  const { user } = useAuth()
  const [addError, setAddError] = useState<AddItemError | null>(null)

  const handleAdd = async (item: string | ShoppingItem) => {
    if (!listId) {
      return
    }
    onAddStart(listId)
    setAddError(null)
    try {
      if (typeof item !== 'string') {
        await uncheckItem(listId, item.id, activeItems)
        return
      }
      await addItem(
        listId,
        item,
        { uid, displayName: user?.displayName },
        activeItems,
      )
    } catch {
      setAddError('unknown')
    }
  }

  return { addError, handleAdd }
}
