import { useEffect, useRef, useState, type FormEvent } from 'react'

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
    <form onSubmit={handleSubmit}>
      <label htmlFor="add-item-text-input">Položka</label>
      <input
        id="add-item-text-input"
        type="text"
        value={text}
        disabled={pending}
        onChange={(event) => setText(event.target.value)}
      />
      <button type="submit" disabled={submitDisabled}>
        Pridať
      </button>
      {error && <p role="alert">Niečo sa pokazilo. Skúste to znova.</p>}
    </form>
  )
}
