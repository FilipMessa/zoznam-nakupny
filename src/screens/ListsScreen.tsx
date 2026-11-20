import { Flex } from '@chakra-ui/react'
import { LoadingScreen } from '@/features/auth/components/LoadingScreen'
import { useListsScreen } from './useListsScreen'
import { EmptyListsState } from '@/features/lists/components/EmptyListsState'
import { CreateListForm } from '@/features/lists/components/CreateListForm'
import { RenameListForm } from '@/features/lists/components/RenameListForm'
import { DeleteListConfirmDialog } from '@/features/lists/components/DeleteListConfirmDialog'
import { ListSwitcherOverlay } from '@/features/lists/components/ListSwitcherOverlay'
import { ListHeader } from '@/features/lists/components/ListHeader'
import { AllListsScreen } from '@/features/allLists/components/AllListsScreen'
import { ShoppingListScreen } from '@/features/items/components/ShoppingListScreen'

export function ListsScreen() {
  const {
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
  } = useListsScreen()

  if (listsLoading) {
    return <LoadingScreen />
  }

  if (lists.length === 0) {
    return (
      <div>
        <EmptyListsState onCreateClick={createForm.openCreateForm} />
        {createForm.showCreateForm && (
          <CreateListForm
            onSubmit={createForm.handleCreate}
            onCancel={createForm.handleCancelCreate}
            pending={createForm.createPending}
            error={createForm.createError}
          />
        )}
      </div>
    )
  }

  if (allListsOpen) {
    return <AllListsScreen lists={lists} onClose={closeAllLists} />
  }

  return (
    <div>
      {selectedList && (
        <Flex direction="column" h="100dvh" minH="0" bg="bg">
          <ListHeader
            listName={selectedList.name}
            pendingSync={selectedList.pendingSync}
            onOpenSwitcher={openSwitcher}
            onOpenAllLists={openAllLists}
            onRenameClick={renameForm.openRenameForm}
            onDeleteClick={deleteFlow.openDeleteConfirm}
            onSignOut={onSignOut}
          />
          <ShoppingListScreen listId={selectedList.id} />
        </Flex>
      )}

      {renameForm.showRenameForm && selectedList && (
        <RenameListForm
          initialName={selectedList.name}
          onSubmit={renameForm.handleRename}
          pending={renameForm.renamePending}
          error={renameForm.renameError}
        />
      )}

      {createForm.showCreateForm && (
        <CreateListForm
          onSubmit={createForm.handleCreate}
          onCancel={createForm.handleCancelCreate}
          pending={createForm.createPending}
          error={createForm.createError}
        />
      )}

      <DeleteListConfirmDialog
        open={deleteFlow.showDeleteConfirm}
        listName={selectedList?.name ?? ''}
        onConfirm={() => void deleteFlow.handleDelete()}
        onCancel={deleteFlow.closeDeleteConfirm}
      />

      <ListSwitcherOverlay
        open={switcherOpen}
        lists={lists}
        selectedListId={selectedListId}
        onSelect={selectList}
        onClose={closeSwitcher}
        onCreate={handleCreateFromSwitcher}
      />
    </div>
  )
}
