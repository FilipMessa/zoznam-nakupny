import { useRef } from 'react'
import { Box, Flex, Heading, IconButton } from '@chakra-ui/react'
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core'
import { ArrowLeft, Plus } from 'lucide-react'
import { useShoppingListDndSensors } from '../../items/dndSensors'
import { AddItemForm } from '../../items/components/AddItemForm'
import { useAllListsScreen } from '../useAllListsScreen'
import { AllListsSection } from './AllListsSection'
import { AllListsDoneSection } from './AllListsDoneSection'
import { CreateListForm } from './CreateListForm'
import { DraggedItemPreview } from './DraggedItemPreview'
import type { ShoppingList } from '../types'

export interface AllListsScreenProps {
  lists: ShoppingList[]
  onClose: () => void
}

export function AllListsScreen({ lists, onClose }: AllListsScreenProps) {
  const {
    isExpanded,
    toggleSection,
    registerActiveItems,
    draggedItem,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    showCreateForm,
    openCreateForm,
    handleCancelCreate,
    handleCreate,
    createPending,
    createError,
    addTargetListId,
    isAddTarget,
    selectAddTarget,
    registerScrollRequester,
    addItemError,
    handleAddItem,
    registerDoneItems,
    doneItems,
    handleUncheckDone,
    handleDeleteDone,
    handleClearAllDone,
  } = useAllListsScreen(lists)
  const sensors = useShoppingListDndSensors()
  const mainScrollRef = useRef<HTMLElement>(null)

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
          onClick={openCreateForm}
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
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <Box as="main" ref={mainScrollRef} flex="1 1 auto" minH="0" overflowY="auto">
          {lists.map((list) => (
            <AllListsSection
              key={list.id}
              list={list}
              expanded={isExpanded(list.id)}
              onToggle={toggleSection}
              onActiveItemsChange={registerActiveItems}
              onDoneItemsChange={registerDoneItems}
              isAddTarget={isAddTarget(list.id)}
              onSelectAddTarget={selectAddTarget}
              mainScrollRef={mainScrollRef}
              onRegisterScrollRequester={registerScrollRequester}
            />
          ))}
          <AllListsDoneSection
            items={doneItems}
            onUncheck={handleUncheckDone}
            onDelete={handleDeleteDone}
            onClearAll={handleClearAllDone}
          />
        </Box>
        <DragOverlay>
          {draggedItem ? <DraggedItemPreview item={draggedItem} /> : null}
        </DragOverlay>
      </DndContext>

      {addTargetListId && (
        <Box flex="0 0 auto" bg="bg" borderTop="1px solid" borderColor="border" pb="env(safe-area-inset-bottom)">
          <AddItemForm onSubmit={handleAddItem} error={addItemError} />
        </Box>
      )}

      {showCreateForm && (
        <CreateListForm
          onSubmit={handleCreate}
          onCancel={handleCancelCreate}
          pending={createPending}
          error={createError}
        />
      )}
    </Flex>
  )
}
