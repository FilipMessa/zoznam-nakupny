import { useState, type ChangeEvent, type FormEvent } from 'react'

export interface UseInviteCodeFieldParams {
  pending: boolean
  onSubmit: (code: string) => void
}

export interface UseInviteCodeFieldResult {
  code: string
  handleCodeChange: (event: ChangeEvent<HTMLInputElement>) => void
  submitDisabled: boolean
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void
}

// Invite-code field with a trim-gated submit, mirroring the lists feature's
// useListNameField.
export function useInviteCodeField({
  pending,
  onSubmit,
}: UseInviteCodeFieldParams): UseInviteCodeFieldResult {
  const [code, setCode] = useState('')

  const trimmedCode = code.trim()
  const submitDisabled = pending || trimmedCode.length === 0

  const handleCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCode(event.target.value)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitDisabled) {
      return
    }
    onSubmit(trimmedCode)
  }

  return { code, handleCodeChange, submitDisabled, handleSubmit }
}
