import type { ShoppingItem } from '../types'
import { DoneItemRow } from './DoneItemRow'

export interface DoneItemsListProps {
  items: ShoppingItem[]
  onUncheck: (id: string) => void
  onDelete: (id: string) => void
}

export function DoneItemsList({ items, onUncheck, onDelete }: DoneItemsListProps) {
  if (items.length === 0) {
    return <p className="empty-hint">Zatiaľ nič hotové.</p>
  }

  return (
    <ul className="item-list">
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
