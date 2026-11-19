import { useState } from 'react'
import { addItem } from './itemApi'
import type { ShoppingItem } from './types'

export interface UseAddItemSubmitParams {
  listId: string
  uid: string | null
  activeItems: ShoppingItem[]
  onAddStart: () => void
}

export interface UseAddItemSubmitResult {
  addError: string | null
  handleAdd: (text: string) => Promise<void>
}

export function useAddItemSubmit({
  listId,
  uid,
  activeItems,
  onAddStart,
}: UseAddItemSubmitParams): UseAddItemSubmitResult {
  const [addError, setAddError] = useState<string | null>(null)

  const handleAdd = async (text: string) => {
    if (!uid) {
      return
    }
    onAddStart()
    setAddError(null)
    try {
      await addItem(listId, text, uid, activeItems)
    } catch {
      setAddError('unknown')
    }
  }

  return { addError, handleAdd }
}
