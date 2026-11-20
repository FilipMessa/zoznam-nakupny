import { useState } from 'react'
import { addItem } from './itemApi'
import type { ShoppingItem } from './types'

export interface UseAddItemSubmitParams {
  // null while there's nowhere to add to yet (the All Lists screen before a
  // target list is picked) -- submitting is then a no-op.
  listId: string | null
  uid: string
  activeItems: ShoppingItem[]
  onAddStart: (listId: string) => void
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
    if (!listId) {
      return
    }
    onAddStart(listId)
    setAddError(null)
    try {
      await addItem(listId, text, uid, activeItems)
    } catch {
      setAddError('unknown')
    }
  }

  return { addError, handleAdd }
}
