import { useState } from 'react'
import { redeemInviteCode } from './inviteApi'
import { useSignedInUid } from './useSignedInUid'
import type { RedeemError } from './types'

export interface UseRedeemInviteCodeResult {
  pending: boolean
  error: RedeemError | null
  handleSubmit: (code: string) => Promise<void>
}

export function useRedeemInviteCode(
  markAsMember: () => void,
): UseRedeemInviteCodeResult {
  const uid = useSignedInUid()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<RedeemError | null>(null)

  const handleSubmit = async (code: string) => {
    setPending(true)
    setError(null)
    const result = await redeemInviteCode(uid, code)
    setPending(false)

    if (result.ok) {
      markAsMember()
    } else {
      setError(result.error)
    }
  }

  return { pending, error, handleSubmit }
}
