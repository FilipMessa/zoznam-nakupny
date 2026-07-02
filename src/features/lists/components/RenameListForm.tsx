import { useState, type FormEvent } from 'react'

export interface RenameListFormProps {
  initialName: string
  onSubmit: (name: string) => void
  pending: boolean
  error: string | null
}

export function RenameListForm({
  initialName,
  onSubmit,
  pending,
  error,
}: RenameListFormProps) {
  const [name, setName] = useState(initialName)

  const trimmedName = name.trim()
  const submitDisabled = pending || trimmedName.length === 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitDisabled) {
      return
    }
    onSubmit(trimmedName)
  }

  return (
    <div className="modal-overlay">
      <form className="modal-card" onSubmit={handleSubmit}>
        <p className="modal-title">Premenovať zoznam</p>
        <label className="field-label" htmlFor="rename-list-name-input">
          List name
        </label>
        <input
          id="rename-list-name-input"
          className="text-input"
          type="text"
          value={name}
          disabled={pending}
          onChange={(event) => setName(event.target.value)}
        />
        {error && (
          <p role="alert" className="form-error">
            Something went wrong. Please try again.
          </p>
        )}
        <button type="submit" className="primary-btn" disabled={submitDisabled}>
          Save
        </button>
      </form>
    </div>
  )
}
