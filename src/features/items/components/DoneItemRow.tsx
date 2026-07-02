import { Trash2 } from 'lucide-react'
import type { ShoppingItem } from '../types'

export interface DoneItemRowProps {
  item: ShoppingItem
  onUncheck: (id: string) => void
  onDelete: (id: string) => void
}

export function DoneItemRow({ item, onUncheck, onDelete }: DoneItemRowProps) {
  return (
    <li className="item-row item-done">
      <label className="item-label">
        <input
          className="item-check"
          type="checkbox"
          checked={true}
          onChange={() => onUncheck(item.id)}
        />
        <span className="item-text">{item.text}</span>
      </label>
      <button
        type="button"
        className="icon-btn delete-btn"
        aria-label="Zmazať"
        onClick={() => onDelete(item.id)}
      >
        <Trash2 size={17} />
      </button>
    </li>
  )
}
