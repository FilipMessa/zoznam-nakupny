import type { ShoppingItem } from '../types'
import { DoneItemRow } from './DoneItemRow'

export interface DoneItemsListProps {
  items: ShoppingItem[]
  onUncheck: (id: string) => void
  onDelete: (id: string) => void
}

export function DoneItemsList({ items, onUncheck, onDelete }: DoneItemsListProps) {
  if (items.length === 0) {
    return <p>No done items. Nothing done yet!</p>
  }

  return (
    <ul>
      {items.map((item) => (
        <DoneItemRow
          key={item.id}
          item={item}
          onUncheck={onUncheck}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}
