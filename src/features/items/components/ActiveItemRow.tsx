import { memo } from 'react'
import { Box } from '@chakra-ui/react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ShoppingItem } from '@/features/items/types'
import { useRowSwipeSync } from '@/features/items/useRowSwipeSync'
import { useItemEditForm } from '@/features/items/useItemEditForm'
import {
  ActiveItemSwipeActions,
  SWIPE_ACTIONS_WIDTH,
} from './ActiveItemSwipeActions'
import { ActiveItemEditForm } from './ActiveItemEditForm'
import { ActiveItemContent } from './ActiveItemContent'

export interface ActiveItemRowProps {
  item: ShoppingItem
  onCheck: (id: string) => void
  onDelete: (id: string) => void
  isEditing: boolean
  onStartEdit: (id: string) => void
  onSubmitEdit: (id: string, text: string) => void
  onCancelEdit: () => void
  isSwipeOpen: boolean
  onSwipeOpenChange: (open: boolean) => void
  // Attached to dnd-kit's useSortable `data` -- lets a shared DndContext
  // spanning multiple lists (the "All Lists" screen) identify which list a
  // dragged/hovered row belongs to via active.data.current/over.data.current.
  // Unused by ActiveItemsList's single-list DndContext.
  sortableData?: Record<string, unknown>
  // Dims this row while it's the one being dragged, instead of relying on
  // it visually following the pointer via its own useSortable transform.
  // Opt-in because that transform-follows-pointer behavior only breaks
  // down once `over` can leave this row's own SortableContext (a cross-list
  // drag) -- AllListsSection sets this and pairs it with a <DragOverlay>
  // clone that does the pointer-following instead; ActiveItemsList's
  // single-list usage never hits that case and is unaffected by default.
  dimWhileDragging?: boolean
}

function ActiveItemRowImpl({
  item,
  onCheck,
  onDelete,
  isEditing,
  onStartEdit,
  onSubmitEdit,
  onCancelEdit,
  isSwipeOpen,
  onSwipeOpenChange,
  sortableData,
  dimWhileDragging,
}: ActiveItemRowProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: isEditing, data: sortableData })

  const {
    swipeOffset,
    isSwiping,
    closeSwipeAction,
    swipeHandlers,
    onForegroundClickCapture,
  } = useRowSwipeSync({
    actionsWidth: SWIPE_ACTIONS_WIDTH,
    isSwipeOpen,
    onSwipeOpenChange,
    // Entering edit mode always closes the swipe -- see useRowSwipeSync.
    forceClosed: isEditing,
  })

  const { inputRef, handleEditKeyDown, handleEditBlur, handleEditSubmit } =
    useItemEditForm({
      itemId: item.id,
      onSubmitEdit,
      onCancelEdit,
    })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleDelete = () => {
    closeSwipeAction()
    onSwipeOpenChange(false)
    onDelete(item.id)
  }

  const handleEditTrigger = () => {
    closeSwipeAction()
    onSwipeOpenChange(false)
    onStartEdit(item.id)
  }

  return (
    <Box
      as="li"
      ref={setNodeRef}
      style={style}
      position="relative"
      minH="56px"
      overflow="hidden"
      animation="itemIn 0.3s ease"
      data-testid={`active-item-${item.id}`}
      data-swipe-row={item.id}
      {...(isDragging &&
        (dimWhileDragging
          ? { opacity: 0.4, pos: 'relative' }
          : {
              borderRadius: '14px',
              boxShadow: '0 8px 28px rgba(28, 21, 16, 0.18)',
              pos: 'relative',
              zIndex: '20',
            }))}
    >
      <ActiveItemSwipeActions
        hidden={isEditing || swipeOffset === 0}
        onEdit={handleEditTrigger}
        onDelete={handleDelete}
      />

      {isEditing ? (
        <ActiveItemEditForm
          itemId={item.id}
          text={item.text}
          inputRef={inputRef}
          onSubmit={handleEditSubmit}
          onKeyDown={handleEditKeyDown}
          onBlur={handleEditBlur}
        />
      ) : (
        <ActiveItemContent
          item={item}
          isDragging={isDragging}
          swipeOffset={swipeOffset}
          isSwiping={isSwiping}
          activatorRef={setActivatorNodeRef}
          gestureProps={{
            ...attributes,
            ...listeners,
            ...swipeHandlers,
            onClickCapture: onForegroundClickCapture,
          }}
          onCheck={onCheck}
          onStartEdit={onStartEdit}
          onDelete={handleDelete}
        />
      )}
    </Box>
  )
}

export const ActiveItemRow = memo(ActiveItemRowImpl)
