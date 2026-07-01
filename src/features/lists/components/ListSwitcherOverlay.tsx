import type { ShoppingList } from '../types'
import { ListSwitcherItem } from './ListSwitcherItem'

export interface ListSwitcherOverlayProps {
  open: boolean
  lists: ShoppingList[]
  selectedListId: string | null
  onSelect: (listId: string) => void
  onClose: () => void
  onCreate: () => void
}

export function ListSwitcherOverlay({
  open,
  lists,
  selectedListId,
  onSelect,
  onClose,
  onCreate,
}: ListSwitcherOverlayProps) {
  if (!open) {
    return null
  }

  return (
    <div className="list-switcher-overlay">
      <div
        className="list-switcher-backdrop"
        data-testid="list-switcher-backdrop"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Prepnúť zoznam"
        className="list-switcher-sheet"
      >
        <ul>
          {lists.map((list) => (
            <ListSwitcherItem
              key={list.id}
              list={list}
              selected={list.id === selectedListId}
              onSelect={(listId) => {
                onSelect(listId)
                onClose()
              }}
            />
          ))}
        </ul>
        <button type="button" onClick={onCreate}>
          Vytvoriť nový zoznam
        </button>
        <button type="button" onClick={onClose}>
          Zatvoriť
        </button>
      </div>
    </div>
  )
}
