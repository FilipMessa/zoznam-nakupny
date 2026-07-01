export interface EmptyListsStateProps {
  onCreateClick: () => void
}

export function EmptyListsState({ onCreateClick }: EmptyListsStateProps) {
  return (
    <div>
      <p>Create your first list to get started.</p>
      <button type="button" onClick={onCreateClick}>
        Create list
      </button>
    </div>
  )
}
