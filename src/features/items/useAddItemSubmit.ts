import { useState } from 'react'
import { useAuth } from '@/features/auth/useAuth'
import { addItem } from './itemApi'
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
  handleAdd: (text: string) => Promise<void>
}

export function useAddItemSubmit({
  listId,
  uid,
  activeItems,
  onAddStart,
}: UseAddItemSubmitParams): UseAddItemSubmitResult {
  const { user } = useAuth()
  const [addError, setAddError] = useState<AddItemError | null>(null)

  const handleAdd = async (text: string) => {
    if (!listId) {
      return
    }
    onAddStart(listId)
    setAddError(null)
    try {
      await addItem(
        listId,
        text,
        { uid, displayName: user?.displayName },
        activeItems,
      )
    } catch {
      setAddError('unknown')
    }
  }

  return { addError, handleAdd }
}
