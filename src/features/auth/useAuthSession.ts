import { useEffect, useState } from 'react'
import type { Unsubscribe, User } from 'firebase/auth'
import type { AuthContextValue } from './AuthContext'
import { completeRedirectSignIn, subscribeAuthState } from './authApi'

// Owns the auth session state behind AuthProvider: finishes any pending
// redirect sign-in first, then follows the signed-in user.
export function useAuthSession(): AuthContextValue {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    let unsubscribe: Unsubscribe | undefined

    completeRedirectSignIn()
      .catch((error) => {
        console.error('Redirect sign-in failed', error)
      })
      .finally(() => {
        if (!isMounted) {
          return
        }

        unsubscribe = subscribeAuthState((nextUser) => {
          setUser(nextUser)
          setAuthLoading(false)
        })
      })

    return () => {
      isMounted = false
      unsubscribe?.()
    }
  }, [])

  return { user, authLoading }
}
