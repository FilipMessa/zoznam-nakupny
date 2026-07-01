import { useState, type FormEvent } from 'react'
import type { RedeemError } from '../types'

export interface InviteCodeFormProps {
  onSubmit: (code: string) => void
  pending: boolean
  error: RedeemError | null
}

export function InviteCodeForm({ onSubmit, pending, error }: InviteCodeFormProps) {
  const [code, setCode] = useState('')

  const trimmedCode = code.trim()
  const submitDisabled = pending || trimmedCode.length === 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitDisabled) {
      return
    }
    onSubmit(trimmedCode)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="invite-code-input">Invite code</label>
      <input
        id="invite-code-input"
        type="text"
        value={code}
        disabled={pending}
        onChange={(event) => setCode(event.target.value)}
      />
      <button type="submit" disabled={submitDisabled}>
        Join
      </button>
      {error === 'invalid-code' && <p role="alert">Invalid invite code</p>}
      {error === 'unknown' && (
        <p role="alert">Something went wrong. Please try again.</p>
      )}
    </form>
  )
}
