import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { ShoppingItem } from '../types'

export interface ActiveItemRowProps {
  item: ShoppingItem
  onCheck: (id: string) => void
}

export function ActiveItemRow({ item, onCheck }: ActiveItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'item-row dragging' : 'item-row'}
    >
      <button
        type="button"
        className="icon-btn drag-handle"
        aria-label="Presunúť"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={20} />
      </button>
      <label className="item-label">
        <input
          className="item-check"
          type="checkbox"
          checked={false}
          onChange={() => onCheck(item.id)}
        />
        <span className="item-text">{item.text}</span>
      </label>
    </li>
  )
}
