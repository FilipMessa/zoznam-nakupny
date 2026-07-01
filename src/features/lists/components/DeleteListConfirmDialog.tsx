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
    <div role="dialog" aria-modal="true" aria-label="Delete list">
      <p>
        Are you sure you want to delete <strong>{listName}</strong>? This will
        also delete all of its items.
      </p>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
      <button type="button" onClick={onConfirm}>
        Delete
      </button>
    </div>
  )
}
