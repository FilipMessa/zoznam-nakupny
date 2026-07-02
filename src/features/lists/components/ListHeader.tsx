import { ChevronDown, LogOut, Pencil, Trash2 } from 'lucide-react'
import { signOutUser } from '../../auth/googleAuth'

export interface ListHeaderProps {
  listName: string
  onOpenSwitcher: () => void
  onRenameClick: () => void
  onDeleteClick: () => void
}

export function ListHeader({
  listName,
  onOpenSwitcher,
  onRenameClick,
  onDeleteClick,
}: ListHeaderProps) {
  return (
    <header className="list-header">
      <button
        type="button"
        className="icon-btn list-title-btn"
        aria-label="Prepnúť zoznam"
        onClick={onOpenSwitcher}
      >
        <span className="list-title">{listName}</span>
        <ChevronDown className="list-title-chevron" size={18} />
      </button>
      <span className="live-dot" title="Živé spojenie" aria-hidden="true" />
      <button
        type="button"
        className="icon-btn"
        aria-label="Premenovať"
        onClick={onRenameClick}
      >
        <Pencil size={18} />
      </button>
      <button
        type="button"
        className="icon-btn"
        aria-label="Zmazať zoznam"
        onClick={onDeleteClick}
      >
        <Trash2 size={18} />
      </button>
      <button
        type="button"
        className="icon-btn"
        aria-label="Odhlásiť sa"
        onClick={() => void signOutUser()}
      >
        <LogOut size={18} />
      </button>
    </header>
  )
}
