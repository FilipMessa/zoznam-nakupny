import { useState } from 'react'
import { useAuth } from '@/features/auth/useAuth'
import { useLists } from '@/features/lists/useLists'
import { useSelectedListId } from '@/features/lists/useSelectedListId'
import { useCreateListForm } from '@/features/lists/useCreateListForm'
import { useRenameListForm } from '@/features/lists/useRenameListForm'
import { useDeleteListFlow } from '@/features/lists/useDeleteListFlow'

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
  } = useCreateListForm({
    uid: user?.uid ?? null,
    onCreated: selectList,
  })
  const {
    showRenameForm,
    openRenameForm,
    handleRename,
    renamePending,
    renameError,
  } = useRenameListForm(selectedList)
  const {
    showDeleteConfirm,
    openDeleteConfirm,
    closeDeleteConfirm,
    handleDelete,
  } = useDeleteListFlow(selectedList)

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

  const [allListsOpen, setAllListsOpen] = useState(false)
  // Tracks whether `lists` was empty as of the last render, so the block
  // below can detect the empty -> non-empty transition without an effect.
  const [wasListsEmpty, setWasListsEmpty] = useState(lists.length === 0)

  const openAllLists = () => {
    setAllListsOpen(true)
  }

  const closeAllLists = () => {
    setAllListsOpen(false)
  }

  // If every list disappears while the All Lists screen is open (the last
  // list was deleted, possibly by another Member), ListsScreen falls back
  // to the empty-lists state -- but without this, allListsOpen would stay
  // stale-true, so creating a new list from that empty state would
  // silently re-enter the All Lists screen instead of the normal
  // single-list flow a first-time-again user expects. Adjusted during
  // render (React's documented pattern for resetting state when a derived
  // condition changes) rather than in an effect, which would cost an extra
  // render pass for no benefit here.
  const listsAreEmptyNow = lists.length === 0
  if (listsAreEmptyNow !== wasListsEmpty) {
    setWasListsEmpty(listsAreEmptyNow)
    if (listsAreEmptyNow) {
      setAllListsOpen(false)
    }
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
    allListsOpen,
    openAllLists,
    closeAllLists,
  }
}
