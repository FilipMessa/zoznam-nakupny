import { useState, type ChangeEvent, type FormEvent } from 'react'

export interface UseListNameFieldParams {
  initialName?: string
  pending: boolean
  onSubmit: (name: string) => void
}

export interface UseListNameFieldResult {
  name: string
  handleNameChange: (event: ChangeEvent<HTMLInputElement>) => void
  submitDisabled: boolean
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void
}

// List-name field with a trim-gated submit, shared by CreateListForm
// (empty initial value) and RenameListForm (prefilled with the current name).
export function useListNameField({
  initialName = '',
  pending,
  onSubmit,
}: UseListNameFieldParams): UseListNameFieldResult {
  const [name, setName] = useState(initialName)

  const trimmedName = name.trim()
  const submitDisabled = pending || trimmedName.length === 0

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitDisabled) {
      return
    }
    onSubmit(trimmedName)
  }

  return { name, handleNameChange, submitDisabled, handleSubmit }
}
