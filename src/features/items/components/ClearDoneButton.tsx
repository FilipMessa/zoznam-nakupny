export interface ClearDoneButtonProps {
  doneCount: number
  onClear: () => void
}

export function ClearDoneButton({ doneCount, onClear }: ClearDoneButtonProps) {
  return (
    <button
      type="button"
      className="clear-done-btn"
      disabled={doneCount === 0}
      onClick={onClear}
    >
      Vymazať hotové
    </button>
  )
}
