export interface EmptyListsStateProps {
  onCreateClick: () => void
}

export function EmptyListsState({ onCreateClick }: EmptyListsStateProps) {
  return (
    <div>
      <p>Vytvorte si svoj prvý zoznam a začnite nakupovať.</p>
      <button type="button" onClick={onCreateClick}>
        Vytvoriť zoznam
      </button>
    </div>
  )
}
