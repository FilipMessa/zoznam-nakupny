import { useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type Unsubscribe, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { AuthContext } from './AuthContext'
import { completeRedirectSignIn } from './authApi'

export function AuthProvider({ children }: { children: ReactNode }) {
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

        unsubscribe = onAuthStateChanged(auth, (nextUser) => {
          setUser(nextUser)
          setAuthLoading(false)
        })
      })

    return () => {
      isMounted = false
      unsubscribe?.()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, authLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
