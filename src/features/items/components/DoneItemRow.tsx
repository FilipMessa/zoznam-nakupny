import type { ShoppingItem } from '../types'

export interface DoneItemRowProps {
  item: ShoppingItem
  onUncheck: (id: string) => void
  onDelete: (id: string) => void
}

export function DoneItemRow({ item, onUncheck, onDelete }: DoneItemRowProps) {
  return (
    <li>
      <label>
        <input
          type="checkbox"
          checked={true}
          onChange={() => onUncheck(item.id)}
        />
        {item.text}
      </label>
      <button type="button" onClick={() => onDelete(item.id)}>
        Delete
      </button>
    </li>
  )
}
