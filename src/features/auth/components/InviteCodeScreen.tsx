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
      <h1>Join your family</h1>
      <p>Enter the invite code you received to join.</p>
      <InviteCodeForm onSubmit={handleSubmit} pending={pending} error={error} />
    </div>
  )
}
