import { useState } from 'react'
import type { User } from 'firebase/auth'
import { createList } from './listService'

export interface UseCreateListFormParams {
  user: User | null
  selectList: (listId: string) => void
}

export interface UseCreateListFormResult {
  showCreateForm: boolean
  openCreateForm: () => void
  handleCancelCreate: () => void
  handleCreate: (name: string) => Promise<void>
  createPending: boolean
  createError: string | null
}

export function useCreateListForm({
  user,
  selectList,
}: UseCreateListFormParams): UseCreateListFormResult {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createPending, setCreatePending] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const openCreateForm = () => {
    setShowCreateForm(true)
  }

  const handleCancelCreate = () => {
    setShowCreateForm(false)
    setCreateError(null)
  }

  const handleCreate = async (name: string) => {
    if (!user) {
      return
    }
    setCreatePending(true)
    setCreateError(null)
    try {
      const listId = await createList(name, user.uid)
      selectList(listId)
      setShowCreateForm(false)
    } catch {
      setCreateError('unknown')
    } finally {
      setCreatePending(false)
    }
  }

  return {
    showCreateForm,
    openCreateForm,
    handleCancelCreate,
    handleCreate,
    createPending,
    createError,
  }
}
