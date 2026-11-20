import { useState } from 'react'
import { signOutUser } from '@/features/auth/authApi'
import { useSignedInUid } from '@/features/auth/useSignedInUid'
import { useLists } from '@/features/lists/useLists'
import { useSelectedListId } from '@/features/lists/useSelectedListId'
import { useCreateListForm } from '@/features/lists/useCreateListForm'
import { useRenameListForm } from '@/features/lists/useRenameListForm'
import { useDeleteListFlow } from '@/features/lists/useDeleteListFlow'

export function useListsScreen() {
  const uid = useSignedInUid()
  const { lists, listsLoading } = useLists()
  const { selectedListId, selectList } = useSelectedListId(lists)

  const selectedList = lists.find((list) => list.id === selectedListId) ?? null

  const createForm = useCreateListForm({ uid, onCreated: selectList })
  const renameForm = useRenameListForm(selectedList)
  const deleteFlow = useDeleteListFlow(selectedList)

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
    createForm.openCreateForm()
  }

  const onSignOut = () => {
    void signOutUser()
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
    createForm,
    renameForm,
    deleteFlow,
    switcherOpen,
    openSwitcher,
    closeSwitcher,
    handleCreateFromSwitcher,
    allListsOpen,
    openAllLists,
    closeAllLists,
    onSignOut,
  }
}
