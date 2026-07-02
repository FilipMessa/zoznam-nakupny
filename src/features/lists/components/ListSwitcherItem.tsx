import type { ShoppingList } from '../types'

export interface ListSwitcherItemProps {
  list: ShoppingList
  selected: boolean
  onSelect: (listId: string) => void
}

export function ListSwitcherItem({
  list,
  selected,
  onSelect,
}: ListSwitcherItemProps) {
  return (
    <li className="list-switcher-item">
      <button
        type="button"
        aria-current={selected ? 'true' : undefined}
        onClick={() => onSelect(list.id)}
      >
        {list.name}
      </button>
    </li>
  )
}
