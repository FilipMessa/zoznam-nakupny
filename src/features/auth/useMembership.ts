import { useCallback, useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { FAMILY_ID } from '../../constants/family'
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

    const memberRef = doc(db, `families/${FAMILY_ID}/members`, uid)

    const unsubscribe = onSnapshot(
      memberRef,
      (snapshot) => {
        setState({ uid, status: snapshot.exists() ? 'member' : 'non-member' })
      },
      () => {
        // Reading our own not-yet-existing members/{uid} doc is denied by
        // the security rules (isMember() requires the doc to already
        // exist), so permission-denied here is the expected "not a member
        // yet" signal rather than a fatal error.
        setState({ uid, status: 'non-member' })
      },
    )

    return unsubscribe
  }, [uid])

  const markAsMember = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'member' }))
  }, [])

  return { status: state.status, markAsMember }
}
