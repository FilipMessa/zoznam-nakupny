import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { ShoppingItem } from '../types'

export interface ActiveItemRowProps {
  item: ShoppingItem
  onCheck: (id: string) => void
}

export function ActiveItemRow({ item, onCheck }: ActiveItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li ref={setNodeRef} style={style}>
      <button
        type="button"
        className="icon-btn"
        aria-label="Presunúť"
        {...attributes}
        {...listeners}
      >
        <GripVertical />
      </button>
      <label>
        <input
          type="checkbox"
          checked={false}
          onChange={() => onCheck(item.id)}
        />
        {item.text}
      </label>
    </li>
  )
}
