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
    <div className="modal-overlay">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Zmazať zoznam"
        className="modal-card"
      >
        <p className="modal-title">Zmazať „{listName}"?</p>
        <p className="modal-text">
          Zmaže sa zoznam a všetky jeho položky. Nedá sa vrátiť späť.
        </p>
        <div className="modal-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
          >
            Zrušiť
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm}>
            Zmazať
          </button>
        </div>
      </div>
    </div>
  )
}
