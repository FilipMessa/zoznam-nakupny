import { memo } from 'react'
import { Box } from '@chakra-ui/react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ShoppingItem } from '@/features/items/types'
import { useSwipeActions } from '@/features/items/useSwipeActions'
import { useItemEditForm } from '@/features/items/useItemEditForm'
import { useRowTap } from '@/features/items/useRowTap'
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
  // Id-addressed like onCheck, so the list can pass one stable handler to
  // every row instead of a per-row closure that would defeat memo below.
  onSwipeOpenChange: (id: string, open: boolean) => void
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

  const { swipeOffset, isSwiping, swipeHandlers, onForegroundClickCapture } =
    useSwipeActions({
      actionsWidth: SWIPE_ACTIONS_WIDTH,
      // The edit form doesn't apply the swipe transform, so an editing row
      // always rests closed.
      isOpen: isSwipeOpen && !isEditing,
      onOpenChange: (open) => onSwipeOpenChange(item.id, open),
    })

  const { inputRef, handleEditKeyDown, handleEditBlur, handleEditSubmit } =
    useItemEditForm({
      itemId: item.id,
      onSubmitEdit,
      onCancelEdit,
    })

  const handleForegroundTap = useRowTap(() => onCheck(item.id))

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Both close the swipe first, so the row never comes back open after an
  // edit and the parent never keeps a deleted row as its open one.
  const handleDelete = () => {
    onSwipeOpenChange(item.id, false)
    onDelete(item.id)
  }

  const handleEditTrigger = () => {
    onSwipeOpenChange(item.id, false)
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
            onClick: handleForegroundTap,
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
