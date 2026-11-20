import { useMemo } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import { useShoppingListDndSensors } from './dndSensors'
import { planReorder } from './itemService'
import type { ActiveItem } from './types'

// Drag-to-reorder for one list's active items: dnd-kit sensors, the sortable
// ids, and a drag-end handler that turns the drop into a fractional
// activeOrder (ADR 0002) for `onReorder`.
export function useActiveItemsReorder(
  items: ActiveItem[],
  onReorder?: (itemId: string, activeOrder: number) => void,
) {
  const sensors = useShoppingListDndSensors()
  // Stable across renders with the same items: SortableContext's value is
  // keyed on this array's identity, and every row consumes that context, so
  // a fresh array would re-render all (memoized) rows.
  const sortableIds = useMemo(() => items.map((item) => item.id), [items])

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || !onReorder) {
      return
    }
    const activeId = String(active.id)
    const newActiveOrder = planReorder(items, activeId, String(over.id))
    if (newActiveOrder !== null) {
      onReorder(activeId, newActiveOrder)
    }
  }

  return { sensors, sortableIds, handleDragEnd }
}
