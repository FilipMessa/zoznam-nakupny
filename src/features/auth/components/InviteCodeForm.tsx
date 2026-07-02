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
    <form className="invite-form" onSubmit={handleSubmit}>
      <label className="field-label" htmlFor="invite-code-input">
        Pozývací kód
      </label>
      <input
        id="invite-code-input"
        className="text-input invite-input"
        type="text"
        value={code}
        placeholder="RODINA-2024"
        autoCapitalize="characters"
        disabled={pending}
        onChange={(event) => setCode(event.target.value)}
      />
      {error === 'invalid-code' && (
        <p role="alert" className="form-error">
          Neplatný pozývací kód
        </p>
      )}
      {error === 'unknown' && (
        <p role="alert" className="form-error">
          Niečo sa pokazilo. Skúste to znova.
        </p>
      )}
      <button type="submit" className="primary-btn" disabled={submitDisabled}>
        Pripojiť sa
      </button>
    </form>
  )
}
