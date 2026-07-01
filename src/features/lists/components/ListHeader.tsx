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
      <h1>{listName}</h1>
      <button
        type="button"
        className="icon-btn"
        aria-label="Prepnúť zoznam"
        onClick={onOpenSwitcher}
      >
        Prepnúť zoznam
      </button>
      <button
        type="button"
        className="icon-btn"
        aria-label="Premenovať"
        onClick={onRenameClick}
      >
        Premenovať
      </button>
      <button
        type="button"
        className="icon-btn"
        aria-label="Zmazať zoznam"
        onClick={onDeleteClick}
      >
        Zmazať zoznam
      </button>
      <button
        type="button"
        className="icon-btn"
        aria-label="Odhlásiť sa"
        onClick={() => void signOutUser()}
      >
        Odhlásiť sa
      </button>
    </header>
  )
}
