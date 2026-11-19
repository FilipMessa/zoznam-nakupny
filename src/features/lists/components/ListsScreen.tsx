import { Flex } from '@chakra-ui/react'
import { LoadingScreen } from '@/features/auth/components/LoadingScreen'
import { useListsScreen } from '@/features/lists/useListsScreen'
import { EmptyListsState } from './EmptyListsState'
import { CreateListForm } from './CreateListForm'
import { RenameListForm } from './RenameListForm'
import { DeleteListConfirmDialog } from './DeleteListConfirmDialog'
import { ListSwitcherOverlay } from './ListSwitcherOverlay'
import { ListHeader } from './ListHeader'
import { AllListsScreen } from './AllListsScreen'
import { ShoppingListScreen } from '@/features/items/components/ShoppingListScreen'

export function ListsScreen() {
  const {
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
  } = useListsScreen()

  if (listsLoading) {
    return <LoadingScreen />
  }

  if (lists.length === 0) {
    return (
      <div>
        <EmptyListsState onCreateClick={openCreateForm} />
        {showCreateForm && (
          <CreateListForm
            onSubmit={handleCreate}
            onCancel={handleCancelCreate}
            pending={createPending}
            error={createError}
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
            onRenameClick={openRenameForm}
            onDeleteClick={openDeleteConfirm}
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
          onCancel={handleCancelCreate}
          pending={createPending}
          error={createError}
        />
      )}

      <DeleteListConfirmDialog
        open={showDeleteConfirm}
        listName={selectedList?.name ?? ''}
        onConfirm={() => void handleDelete()}
        onCancel={closeDeleteConfirm}
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
