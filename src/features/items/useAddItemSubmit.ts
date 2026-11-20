import { useState } from 'react'
import { useAuth } from '@/features/auth/useAuth'
import { addItem, readdPurchasedItem } from './itemApi'
import { purchasedItemFor } from './itemService'
import type { AddItemError, PurchaseMemoryEntry, ShoppingItem } from './types'

export interface UseAddItemSubmitParams {
  // null while there's nowhere to add to yet (the All Lists screen before a
  // target list is picked) -- submitting is then a no-op.
  listId: string | null
  uid: string
  activeItems: ShoppingItem[]
  // The target List's done Items, newest first: a picked suggestion brings
  // its done Item back from here rather than adding a duplicate.
  doneItems: ShoppingItem[]
  onAddStart: (listId: string) => void
}

export interface UseAddItemSubmitResult {
  addError: AddItemError | null
  handleAdd: (item: string | PurchaseMemoryEntry) => Promise<void>
}

export function useAddItemSubmit({
  listId,
  uid,
  activeItems,
  doneItems,
  onAddStart,
}: UseAddItemSubmitParams): UseAddItemSubmitResult {
  const { user } = useAuth()
  const [addError, setAddError] = useState<AddItemError | null>(null)

  const handleAdd = async (item: string | PurchaseMemoryEntry) => {
    if (!listId) {
      return
    }
    onAddStart(listId)
    setAddError(null)
    const author = { uid, displayName: user?.displayName }
    try {
      if (typeof item === 'string') {
        await addItem(listId, item, author, activeItems)
        return
      }
      const purchased = purchasedItemFor(doneItems, item.text)
      if (purchased) {
        await readdPurchasedItem(listId, purchased.id, author, activeItems)
        return
      }
      await addItem(listId, item.text, author, activeItems)
    } catch {
      setAddError('unknown')
    }
  }

  return { addError, handleAdd }
}
