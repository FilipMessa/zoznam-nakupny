import { Box, Flex, Heading, IconButton } from '@chakra-ui/react'
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core'
import { ArrowLeft, Plus } from 'lucide-react'
import { useShoppingListDndSensors } from '@/features/items/dndSensors'
import { AddItemForm } from '@/features/items/components/AddItemForm'
import { useAllListsScreen } from '@/features/allLists/useAllListsScreen'
import { AllListsSection } from './AllListsSection'
import { AllListsDoneSection } from './AllListsDoneSection'
import { CreateListForm } from '@/features/lists/components/CreateListForm'
import { DraggedItemPreview } from './DraggedItemPreview'
import type { ShoppingList } from '@/features/lists/types'

export interface AllListsScreenProps {
  lists: ShoppingList[]
  onClose: () => void
}

export function AllListsScreen({ lists, onClose }: AllListsScreenProps) {
  const {
    isExpanded,
    toggleSection,
    activeItemsOf,
    mainScrollRef,
    doneItems,
    createForm,
    drag,
    addTarget,
    doneActions,
  } = useAllListsScreen(lists)
  const sensors = useShoppingListDndSensors()

  return (
    <Flex direction="column" h="100dvh" minH="0" bg="bg">
      <Flex
        as="header"
        flex="0 0 auto"
        alignItems="center"
        gap="4px"
        padding="14px 8px 12px 16px"
        borderBottom="1px solid"
        borderColor="border"
        bg="bg"
      >
        <IconButton
          type="button"
          className="icon-btn"
          aria-label="Späť"
          onClick={onClose}
          variant="ghost"
          minW="touchTarget"
          minH="touchTarget"
          color="fg.muted"
          _hover={{ bg: 'bg.muted', color: 'fg' }}
        >
          <ArrowLeft size={20} />
        </IconButton>
        <Heading
          as="h1"
          fontWeight="900"
          fontSize="20px"
          color="fg"
          letterSpacing="-0.5px"
          flex="1 1 auto"
        >
          Všetky zoznamy
        </Heading>
        <IconButton
          type="button"
          className="icon-btn"
          aria-label="Pridať zoznam"
          onClick={createForm.openCreateForm}
          variant="ghost"
          minW="touchTarget"
          minH="touchTarget"
          color="terracotta.solid"
          bg="terracotta.subtle"
          borderRadius="12px"
          _hover={{ bg: 'terracotta.subtle' }}
        >
          <Plus size={20} />
        </IconButton>
      </Flex>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={drag.handleDragStart}
        onDragEnd={drag.handleDragEnd}
        onDragCancel={drag.handleDragCancel}
      >
        <Box
          as="main"
          ref={mainScrollRef}
          flex="1 1 auto"
          minH="0"
          overflowY="auto"
        >
          {lists.map((list) => (
            <AllListsSection
              key={list.id}
              list={list}
              activeItems={activeItemsOf(list.id)}
              expanded={isExpanded(list.id)}
              onToggle={toggleSection}
              isAddTarget={addTarget.isAddTarget(list.id)}
              onSelectAddTarget={addTarget.selectAddTarget}
            />
          ))}
          <AllListsDoneSection
            items={doneItems}
            onUncheck={doneActions.handleUncheckDone}
            onDelete={doneActions.handleDeleteDone}
            onClearAll={doneActions.handleClearAllDone}
          />
        </Box>
        <DragOverlay>
          {drag.draggedItem ? (
            <DraggedItemPreview item={drag.draggedItem} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {addTarget.addTargetListId && (
        <Box
          flex="0 0 auto"
          bg="bg"
          borderTop="1px solid"
          borderColor="border"
          pb="env(safe-area-inset-bottom)"
        >
          <AddItemForm
            suggest={addTarget.suggest}
            onSubmit={addTarget.handleAdd}
            error={addTarget.addError}
          />
        </Box>
      )}

      {createForm.showCreateForm && (
        <CreateListForm
          onSubmit={createForm.handleCreate}
          onCancel={createForm.handleCancelCreate}
          pending={createForm.createPending}
          error={createForm.createError}
        />
      )}
    </Flex>
  )
}
