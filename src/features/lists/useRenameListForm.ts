import { useState } from 'react'
import { renameList } from './listApi'
import type { ShoppingList } from './types'

export interface UseRenameListFormResult {
  showRenameForm: boolean
  openRenameForm: () => void
  handleRename: (name: string) => Promise<void>
  renamePending: boolean
  renameError: string | null
}

export function useRenameListForm(
  selectedList: ShoppingList | null,
): UseRenameListFormResult {
  const [showRenameForm, setShowRenameForm] = useState(false)
  const [renamePending, setRenamePending] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)

  const openRenameForm = () => {
    setShowRenameForm(true)
  }

  const handleRename = async (name: string) => {
    if (!selectedList) {
      return
    }
    setRenamePending(true)
    setRenameError(null)
    try {
      await renameList(selectedList.id, name)
      setShowRenameForm(false)
    } catch {
      setRenameError('unknown')
    } finally {
      setRenamePending(false)
    }
  }

  return {
    showRenameForm,
    openRenameForm,
    handleRename,
    renamePending,
    renameError,
  }
}
