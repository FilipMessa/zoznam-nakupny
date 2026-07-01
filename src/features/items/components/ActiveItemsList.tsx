import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { ShoppingItem } from '../types'
import { reorderActiveItems } from '../itemLogic'
import { ActiveItemRow } from './ActiveItemRow'

export interface ActiveItemsListProps {
  items: ShoppingItem[]
  onCheck: (id: string) => void
  onReorder?: (itemId: string, activeOrder: number) => void
}

export function ActiveItemsList({
  items,
  onCheck,
  onReorder,
}: ActiveItemsListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  if (items.length === 0) {
    return <p>No active items. Nothing to buy!</p>
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
        <ul>
          {items.map((item) => (
            <ActiveItemRow key={item.id} item={item} onCheck={onCheck} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
