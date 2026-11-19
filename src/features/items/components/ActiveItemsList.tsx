import { Box, Text } from '@chakra-ui/react'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { ShoppingItem } from '../types'
import { reorderActiveItems } from '../itemLogic'
import { useShoppingListDndSensors } from '../dndSensors'
import { ActiveItemRow } from './ActiveItemRow'

export interface ActiveItemsListProps {
  items: ShoppingItem[]
  onCheck: (id: string) => void
  onDelete: (id: string) => void
  onReorder?: (itemId: string, activeOrder: number) => void
  editingItemId: string | null
  onStartEdit: (id: string) => void
  onSubmitEdit: (id: string, text: string) => void
  onCancelEdit: () => void
  openSwipeItemId: string | null
  onSwipeOpenChange: (itemId: string, open: boolean) => void
}

export function ActiveItemsList({
  items,
  onCheck,
  onDelete,
  onReorder,
  editingItemId,
  onStartEdit,
  onSubmitEdit,
  onCancelEdit,
  openSwipeItemId,
  onSwipeOpenChange,
}: ActiveItemsListProps) {
  const sensors = useShoppingListDndSensors()

  if (items.length === 0) {
    return (
      <Text
        padding="10px 16px 20px"
        fontSize="14px"
        color="fg.subtle"
        fontWeight="500"
      >
        Žiadne položky na kúpu. Skvelá práca!
      </Text>
    )
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !onReorder) {
      return
    }

    const fromIndex = items.findIndex((item) => item.id === active.id)
    const overIndex = items.findIndex((item) => item.id === over.id)
    if (fromIndex === -1 || overIndex === -1) {
      return
    }

    // reorderActiveItems's `toIndex` is a position in the array-with-moved-
    // item-removed. dnd-kit's `over` index (in the *original*, full array)
    // maps onto that reduced array's index space directly -- this mirrors
    // @dnd-kit/sortable's own `arrayMove(array, from, to)`, which splices
    // the removed element back in at index `to` of the already-shortened
    // array. So `overIndex` can be passed straight through as `toIndex`.
    const newActiveOrder = reorderActiveItems(items, fromIndex, overIndex)
    onReorder(active.id as string, newActiveOrder)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <Box as="ul" listStyle="none" m="0" p="0" css={{ userSelect: 'none' }}>
          {items.map((item) => (
            <ActiveItemRow
              key={item.id}
              item={item}
              onCheck={onCheck}
              onDelete={onDelete}
              isEditing={editingItemId === item.id}
              onStartEdit={onStartEdit}
              onSubmitEdit={onSubmitEdit}
              onCancelEdit={onCancelEdit}
              isSwipeOpen={openSwipeItemId === item.id}
              onSwipeOpenChange={(open) => onSwipeOpenChange(item.id, open)}
            />
          ))}
        </Box>
      </SortableContext>
    </DndContext>
  )
}
