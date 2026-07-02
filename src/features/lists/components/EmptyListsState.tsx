import { Plus, ShoppingBag } from 'lucide-react'

export interface EmptyListsStateProps {
  onCreateClick: () => void
}

export function EmptyListsState({ onCreateClick }: EmptyListsStateProps) {
  return (
    <div className="screen screen-centered empty-state">
      <div className="empty-icon" aria-hidden="true">
        <ShoppingBag size={46} strokeWidth={1.5} />
      </div>
      <h2 className="empty-title">Zatiaľ žiadne zoznamy</h2>
      <p className="empty-text">
        Vytvorte si svoj prvý zoznam a začnite nakupovať.
      </p>
      <button type="button" className="primary-btn" onClick={onCreateClick}>
        <Plus size={20} />
        Vytvoriť zoznam
      </button>
    </div>
  )
}
