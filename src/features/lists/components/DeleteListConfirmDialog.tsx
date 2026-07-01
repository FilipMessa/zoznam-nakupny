export interface DeleteListConfirmDialogProps {
  open: boolean
  listName: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteListConfirmDialog({
  open,
  listName,
  onConfirm,
  onCancel,
}: DeleteListConfirmDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Zmazať zoznam">
      <p>
        Naozaj chcete zmazať zoznam <strong>{listName}</strong>? Zmažú sa tým
        aj všetky jeho položky.
      </p>
      <button type="button" onClick={onCancel}>
        Zrušiť
      </button>
      <button type="button" onClick={onConfirm}>
        Zmazať
      </button>
    </div>
  )
}
