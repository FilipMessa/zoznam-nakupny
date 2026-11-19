import { useCallback, useState } from 'react'
import { editItemText } from './itemService'

export interface UseItemEditingResult {
  editingItemId: string | null
  handleStartEdit: (itemId: string) => void
  handleSubmitEdit: (itemId: string, text: string) => Promise<void>
  handleCancelEdit: () => void
}

export function useItemEditing(listId: string): UseItemEditingResult {
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  const handleStartEdit = useCallback((itemId: string) => {
    setEditingItemId(itemId)
  }, [])

  const handleSubmitEdit = useCallback(
    async (itemId: string, text: string) => {
      setEditingItemId(null)
      await editItemText(listId, itemId, text)
    },
    [listId],
  )

  const handleCancelEdit = useCallback(() => {
    setEditingItemId(null)
  }, [])

  return { editingItemId, handleStartEdit, handleSubmitEdit, handleCancelEdit }
}
