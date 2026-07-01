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
    <form onSubmit={handleSubmit}>
      <label htmlFor="create-list-name-input">List name</label>
      <input
        id="create-list-name-input"
        type="text"
        value={name}
        disabled={pending}
        onChange={(event) => setName(event.target.value)}
      />
      <button type="submit" disabled={submitDisabled}>
        Create list
      </button>
      {error && <p role="alert">Something went wrong. Please try again.</p>}
    </form>
  )
}
