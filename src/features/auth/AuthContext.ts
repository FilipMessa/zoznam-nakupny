import { createContext } from 'react'
import type { User } from 'firebase/auth'

export interface AuthContextValue {
  user: User | null
  authLoading: boolean
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  authLoading: true,
})
