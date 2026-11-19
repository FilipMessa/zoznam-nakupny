import type { ReactNode } from 'react'
import { AuthContext } from './AuthContext'
import { useAuthSession } from './useAuthSession'

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, authLoading } = useAuthSession()

  return (
    <AuthContext.Provider value={{ user, authLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
