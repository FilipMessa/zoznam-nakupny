import { useState } from 'react'
import { deleteList } from './listService'
import type { ShoppingList } from './types'

export interface UseDeleteListFlowResult {
  showDeleteConfirm: boolean
  openDeleteConfirm: () => void
  closeDeleteConfirm: () => void
  handleDelete: () => Promise<void>
}

export function useDeleteListFlow(
  selectedList: ShoppingList | null,
): UseDeleteListFlowResult {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const openDeleteConfirm = () => {
    setShowDeleteConfirm(true)
  }

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false)
  }

  const handleDelete = async () => {
    if (!selectedList) {
      return
    }
    setShowDeleteConfirm(false)
    await deleteList(selectedList.id)
  }

  return { showDeleteConfirm, openDeleteConfirm, closeDeleteConfirm, handleDelete }
}
