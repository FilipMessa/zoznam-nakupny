import type { ShoppingItem } from '../types'

export interface ActiveItemRowProps {
  item: ShoppingItem
  onCheck: (id: string) => void
}

export function ActiveItemRow({ item, onCheck }: ActiveItemRowProps) {
  return (
    <li>
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
