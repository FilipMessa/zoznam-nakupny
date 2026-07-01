import { useState } from 'react'
import { InviteCodeForm } from './InviteCodeForm'
import { redeemInviteCode } from '../inviteService'
import { useAuth } from '../useAuth'
import type { RedeemError } from '../types'

export interface InviteCodeScreenProps {
  markAsMember: () => void
}

export function InviteCodeScreen({ markAsMember }: InviteCodeScreenProps) {
  const { user } = useAuth()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<RedeemError | null>(null)

  const handleSubmit = async (code: string) => {
    if (!user) {
      return
    }
    setPending(true)
    setError(null)
    const result = await redeemInviteCode(user.uid, code)
    setPending(false)

    if (result.ok) {
      markAsMember()
    } else {
      setError(result.error)
    }
  }

  return (
    <div>
      <h1>Pripojte sa k rodine</h1>
      <p>Zadajte pozývací kód, ktorý ste dostali.</p>
      <InviteCodeForm onSubmit={handleSubmit} pending={pending} error={error} />
    </div>
  )
}
