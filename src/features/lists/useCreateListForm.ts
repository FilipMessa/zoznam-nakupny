import { useState } from 'react'
import type { User } from 'firebase/auth'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
import { validateListName } from './listService'
import { createList, generateListId } from './listApi'

export interface UseCreateListFormParams {
  user: User | null
  // Called with the new list's id once it's known -- callers that navigate
  // to the new list pass their selectList; AllListsScreen's caller passes a
  // no-op since staying put and letting the new section auto-expand is the
  // desired behaviour there (see docs/feature-all-lists-add-list.md).
  onCreated: (listId: string) => void
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
  onCreated,
}: UseCreateListFormParams): UseCreateListFormResult {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createPending, setCreatePending] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const isOnline = useOnlineStatus()

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

    if (!isOnline) {
      // createList's write promise won't resolve until reconnect, even
      // though the local cache updates immediately (the same Firestore
      // quirk useAddItemSubmit is structured around for adding items) --
      // unlike an add, selecting the new list needs its id up front, so
      // mint one, validate synchronously, and act on it without waiting
      // for the round trip. The write itself still happens in the
      // background; there's nothing meaningful left to surface if it
      // eventually fails once the form is already closed and the offline
      // banner already communicates the pending-sync state.
      const result = validateListName(name)
      if (!result.ok) {
        setCreateError('unknown')
        setCreatePending(false)
        return
      }
      const listId = generateListId()
      onCreated(listId)
      setShowCreateForm(false)
      setCreatePending(false)
      void createList(result.name, user.uid, listId).catch((error: unknown) => {
        console.error('Failed to create list', error)
      })
      return
    }

    try {
      const listId = await createList(name, user.uid)
      onCreated(listId)
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
