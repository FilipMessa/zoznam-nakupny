import { useState } from 'react'
import { Users } from 'lucide-react'
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
    <div className="screen invite-screen">
      <div className="icon-badge" aria-hidden="true">
        <Users size={22} />
      </div>
      <h1 className="screen-title">Pripojte sa k rodine</h1>
      <p className="screen-subtitle">
        Zadajte pozývací kód, ktorý ste dostali od ostatných členov domácnosti.
      </p>
      <InviteCodeForm onSubmit={handleSubmit} pending={pending} error={error} />
    </div>
  )
}
