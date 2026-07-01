import type { ShoppingItem } from '../types'
import { ActiveItemRow } from './ActiveItemRow'

export interface ActiveItemsListProps {
  items: ShoppingItem[]
  onCheck: (id: string) => void
}

export function ActiveItemsList({ items, onCheck }: ActiveItemsListProps) {
  if (items.length === 0) {
    return <p>No active items. Nothing to buy!</p>
  }

  return (
    <ul>
      {items.map((item) => (
        <ActiveItemRow key={item.id} item={item} onCheck={onCheck} />
      ))}
    </ul>
  )
}
