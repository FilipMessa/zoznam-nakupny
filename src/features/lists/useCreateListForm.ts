import { useState } from 'react'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
import { validateListName } from './listService'
import { createList, generateListId } from './listApi'
import type { CreateListError } from './types'

export interface UseCreateListFormParams {
  uid: string
  // Called with the new list's id once it's known -- callers that navigate
  // to the new list pass their selectList. Omitted where staying put and
  // letting the new section auto-expand is the desired behaviour (the All
  // Lists screen, see docs/feature-all-lists-add-list.md).
  onCreated?: (listId: string) => void
}

export interface UseCreateListFormResult {
  showCreateForm: boolean
  openCreateForm: () => void
  handleCancelCreate: () => void
  handleCreate: (name: string) => Promise<void>
  createPending: boolean
  createError: CreateListError | null
}

export function useCreateListForm({
  uid,
  onCreated,
}: UseCreateListFormParams): UseCreateListFormResult {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createPending, setCreatePending] = useState(false)
  const [createError, setCreateError] = useState<CreateListError | null>(null)
  const isOnline = useOnlineStatus()

  const openCreateForm = () => {
    setShowCreateForm(true)
  }

  const handleCancelCreate = () => {
    setShowCreateForm(false)
    setCreateError(null)
  }

  const handleCreate = async (name: string) => {
    setCreateError(null)
    const result = validateListName(name)
    if (!result.ok) {
      setCreateError('invalid-name')
      return
    }

    // The id is minted up front (no round trip) so the new list can be
    // selected without waiting for the write.
    const listId = generateListId()
    const write = createList(result.name, uid, listId)
    const finish = () => {
      onCreated?.(listId)
      setShowCreateForm(false)
    }

    if (!isOnline) {
      // The write promise won't resolve until reconnect, even though the
      // local cache updates immediately (the same Firestore quirk
      // useAddItemSubmit is structured around), so act on it without
      // waiting. If it eventually fails there's nothing meaningful left to
      // surface: the form is closed and the offline banner already
      // communicates the pending-sync state.
      finish()
      write.catch((error: unknown) => {
        console.error('Failed to create list', error)
      })
      return
    }

    setCreatePending(true)
    try {
      await write
      finish()
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
