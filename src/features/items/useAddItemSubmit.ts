import { useState } from 'react'
import type { User } from 'firebase/auth'
import { addItem } from './itemService'
import type { ShoppingItem } from './types'

export interface UseAddItemSubmitParams {
  listId: string
  user: User | null
  activeItems: ShoppingItem[]
  onAddStart: () => void
}

export interface UseAddItemSubmitResult {
  addError: string | null
  handleAdd: (text: string) => Promise<void>
}

export function useAddItemSubmit({
  listId,
  user,
  activeItems,
  onAddStart,
}: UseAddItemSubmitParams): UseAddItemSubmitResult {
  const [addError, setAddError] = useState<string | null>(null)

  const handleAdd = async (text: string) => {
    if (!user) {
      return
    }
    onAddStart()
    setAddError(null)
    try {
      await addItem(listId, text, user.uid, activeItems)
    } catch {
      setAddError('unknown')
    }
  }

  return { addError, handleAdd }
}
