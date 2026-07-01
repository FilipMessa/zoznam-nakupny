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
    <header>
      <h1>{listName}</h1>
      <button type="button" onClick={onOpenSwitcher}>
        Switch list
      </button>
      <button type="button" onClick={onRenameClick}>
        Rename
      </button>
      <button type="button" onClick={onDeleteClick}>
        Delete list
      </button>
      <button type="button" onClick={() => void signOutUser()}>
        Sign out
      </button>
    </header>
  )
}
