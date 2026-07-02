import { useState } from 'react'
import { Flex } from '@chakra-ui/react'
import { useAuth } from '../../auth/useAuth'
import { LoadingScreen } from '../../auth/components/LoadingScreen'
import { useLists } from '../useLists'
import { useSelectedListId } from '../useSelectedListId'
import { createList, deleteList, renameList } from '../listService'
import { EmptyListsState } from './EmptyListsState'
import { CreateListForm } from './CreateListForm'
import { RenameListForm } from './RenameListForm'
import { DeleteListConfirmDialog } from './DeleteListConfirmDialog'
import { ListSwitcherOverlay } from './ListSwitcherOverlay'
import { ListHeader } from './ListHeader'
import { ShoppingListScreen } from '../../items/components/ShoppingListScreen'

export function ListsScreen() {
  const { user } = useAuth()
  const { lists, listsLoading } = useLists()
  const { selectedListId, selectList } = useSelectedListId(lists)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createPending, setCreatePending] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [showRenameForm, setShowRenameForm] = useState(false)
  const [renamePending, setRenamePending] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [switcherOpen, setSwitcherOpen] = useState(false)

  const selectedList = lists.find((list) => list.id === selectedListId) ?? null

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

  const handleDelete = async () => {
    if (!selectedList) {
      return
    }
    setShowDeleteConfirm(false)
    await deleteList(selectedList.id)
  }

  if (listsLoading) {
    return <LoadingScreen />
  }

  if (lists.length === 0) {
    return (
      <div>
        <EmptyListsState onCreateClick={() => setShowCreateForm(true)} />
        {showCreateForm && (
          <CreateListForm
            onSubmit={handleCreate}
            pending={createPending}
            error={createError}
          />
        )}
      </div>
    )
  }

  return (
    <div>
      {selectedList && (
        <Flex direction="column" h="100dvh" minH="0" bg="bg">
          <ListHeader
            listName={selectedList.name}
            onOpenSwitcher={() => setSwitcherOpen(true)}
            onRenameClick={() => setShowRenameForm(true)}
            onDeleteClick={() => setShowDeleteConfirm(true)}
          />
          <ShoppingListScreen listId={selectedList.id} />
        </Flex>
      )}

      {showRenameForm && selectedList && (
        <RenameListForm
          initialName={selectedList.name}
          onSubmit={handleRename}
          pending={renamePending}
          error={renameError}
        />
      )}

      {showCreateForm && (
        <CreateListForm
          onSubmit={handleCreate}
          pending={createPending}
          error={createError}
        />
      )}

      <DeleteListConfirmDialog
        open={showDeleteConfirm}
        listName={selectedList?.name ?? ''}
        onConfirm={() => void handleDelete()}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ListSwitcherOverlay
        open={switcherOpen}
        lists={lists}
        selectedListId={selectedListId}
        onSelect={selectList}
        onClose={() => setSwitcherOpen(false)}
        onCreate={() => {
          setSwitcherOpen(false)
          setShowCreateForm(true)
        }}
      />
    </div>
  )
}
