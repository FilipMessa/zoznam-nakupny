import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { useLists } from './useLists'
import { useSelectedListId } from './useSelectedListId'
import { useCreateListForm } from './useCreateListForm'
import { useRenameListForm } from './useRenameListForm'
import { useDeleteListFlow } from './useDeleteListFlow'

export function useListsScreen() {
  const { user } = useAuth()
  const { lists, listsLoading } = useLists()
  const { selectedListId, selectList } = useSelectedListId(lists)

  const selectedList = lists.find((list) => list.id === selectedListId) ?? null

  const {
    showCreateForm,
    openCreateForm,
    handleCancelCreate,
    handleCreate,
    createPending,
    createError,
  } = useCreateListForm({ user, selectList })
  const {
    showRenameForm,
    openRenameForm,
    handleRename,
    renamePending,
    renameError,
  } = useRenameListForm(selectedList)
  const { showDeleteConfirm, openDeleteConfirm, closeDeleteConfirm, handleDelete } =
    useDeleteListFlow(selectedList)

  // The switcher overlay's open state lives here (not in a single-intent
  // hook) because its create action coordinates with the create form:
  // picking "Vytvoriť nový zoznam" closes the switcher and opens the form.
  const [switcherOpen, setSwitcherOpen] = useState(false)

  const openSwitcher = () => {
    setSwitcherOpen(true)
  }

  const closeSwitcher = () => {
    setSwitcherOpen(false)
  }

  const handleCreateFromSwitcher = () => {
    setSwitcherOpen(false)
    openCreateForm()
  }

  return {
    lists,
    listsLoading,
    selectedListId,
    selectList,
    selectedList,
    showCreateForm,
    openCreateForm,
    handleCancelCreate,
    handleCreate,
    createPending,
    createError,
    showRenameForm,
    openRenameForm,
    handleRename,
    renamePending,
    renameError,
    showDeleteConfirm,
    openDeleteConfirm,
    closeDeleteConfirm,
    handleDelete,
    switcherOpen,
    openSwitcher,
    closeSwitcher,
    handleCreateFromSwitcher,
  }
}
