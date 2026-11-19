import { useCallback, useEffect, useState } from 'react'
import { subscribeMembership } from './membershipApi'
import type { MembershipStatus } from './types'

export interface UseMembershipResult {
  status: MembershipStatus
  markAsMember: () => void
}

interface MembershipState {
  uid: string | null
  status: MembershipStatus
}

export function useMembership(uid: string | null): UseMembershipResult {
  const [state, setState] = useState<MembershipState>({
    uid: null,
    status: 'idle',
  })

  // Reset (or initialize) status as soon as the uid changes, following the
  // React-recommended "adjust state during render" pattern instead of an
  // Effect, so we never render a stale status for the previous uid.
  if (uid !== state.uid) {
    setState({ uid, status: uid ? 'loading' : 'idle' })
  }

  useEffect(() => {
    if (!uid) {
      return
    }

    return subscribeMembership(uid, (isMember) => {
      setState({ uid, status: isMember ? 'member' : 'non-member' })
    })
  }, [uid])

  const markAsMember = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'member' }))
  }, [])

  return { status: state.status, markAsMember }
}
