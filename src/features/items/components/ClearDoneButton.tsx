export interface ClearDoneButtonProps {
  doneCount: number
  onClear: () => void
}

export function ClearDoneButton({ doneCount, onClear }: ClearDoneButtonProps) {
  return (
    <button type="button" disabled={doneCount === 0} onClick={onClear}>
      Vymazať hotové
    </button>
  )
}
