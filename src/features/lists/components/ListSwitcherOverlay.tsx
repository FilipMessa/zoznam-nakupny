import { Plus, X } from 'lucide-react'
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
        <div className="sheet-header">
          <span className="sheet-grabber" aria-hidden="true" />
          <span className="sheet-title">Moje zoznamy</span>
          <button
            type="button"
            className="icon-btn sheet-close"
            aria-label="Zatvoriť"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        <ul className="sheet-body">
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
        <button type="button" className="sheet-create-btn" onClick={onCreate}>
          <Plus size={18} />
          Vytvoriť nový zoznam
        </button>
      </div>
    </div>
  )
}
