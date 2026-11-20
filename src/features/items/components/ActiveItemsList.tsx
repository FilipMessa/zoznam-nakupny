import { Box, Text } from '@chakra-ui/react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { ActiveItem } from '@/features/items/types'
import { useActiveItemsReorder } from '@/features/items/useActiveItemsReorder'
import { ActiveItemRow } from './ActiveItemRow'

export interface ActiveItemsListProps {
  items: ActiveItem[]
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
  const { sensors, sortableIds, handleDragEnd } = useActiveItemsReorder(
    items,
    onReorder,
  )

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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortableIds}
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
              onSwipeOpenChange={onSwipeOpenChange}
            />
          ))}
        </Box>
      </SortableContext>
    </DndContext>
  )
}
