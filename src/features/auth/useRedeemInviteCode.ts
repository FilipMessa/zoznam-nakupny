import { useState } from 'react'
import { redeemInviteCode } from './inviteApi'
import { useAuth } from './useAuth'
import type { RedeemError } from './types'

export interface UseRedeemInviteCodeResult {
  pending: boolean
  error: RedeemError | null
  handleSubmit: (code: string) => Promise<void>
}

export function useRedeemInviteCode(
  markAsMember: () => void,
): UseRedeemInviteCodeResult {
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

  return { pending, error, handleSubmit }
}
