import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'

export interface AddItemFormProps {
  onSubmit: (text: string) => void
  pending: boolean
  error: string | null
}

export function AddItemForm({ onSubmit, pending, error }: AddItemFormProps) {
  const [text, setText] = useState('')
  const wasPending = useRef(pending)

  useEffect(() => {
    if (wasPending.current && !pending && !error) {
      setText('')
    }
    wasPending.current = pending
  }, [pending, error])

  const trimmedText = text.trim()
  const submitDisabled = pending || trimmedText.length === 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitDisabled) {
      return
    }
    onSubmit(trimmedText)
  }

  return (
    <form className="add-item-form" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="add-item-text-input">
        Položka
      </label>
      <input
        id="add-item-text-input"
        className="add-item-input"
        type="text"
        value={text}
        placeholder="Pridať položku…"
        disabled={pending}
        onChange={(event) => setText(event.target.value)}
      />
      <button
        type="submit"
        className="icon-btn add-item-btn"
        aria-label="Pridať"
        disabled={submitDisabled}
      >
        <Plus size={22} />
      </button>
      {error && (
        <p role="alert" className="form-error">
          Niečo sa pokazilo. Skúste to znova.
        </p>
      )}
    </form>
  )
}
