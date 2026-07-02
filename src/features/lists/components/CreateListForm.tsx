import { useState, type FormEvent } from 'react'

export interface CreateListFormProps {
  onSubmit: (name: string) => void
  pending: boolean
  error: string | null
}

export function CreateListForm({ onSubmit, pending, error }: CreateListFormProps) {
  const [name, setName] = useState('')

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
        <p className="modal-title">Nový zoznam</p>
        <label className="field-label" htmlFor="create-list-name-input">
          Názov zoznamu
        </label>
        <input
          id="create-list-name-input"
          className="text-input"
          type="text"
          value={name}
          placeholder="Napr. Týždenný nákup"
          disabled={pending}
          onChange={(event) => setName(event.target.value)}
        />
        {error && (
          <p role="alert" className="form-error">
            Niečo sa pokazilo. Skúste to znova.
          </p>
        )}
        <button type="submit" className="primary-btn" disabled={submitDisabled}>
          Vytvoriť
        </button>
      </form>
    </div>
  )
}
