import { useState } from 'react'
import { signInWithGoogle } from './authApi'

const NON_FATAL_ERROR_CODES = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/popup-blocked',
])

export interface UseGoogleSignInResult {
  retryMessage: string | null
  handleSignIn: () => Promise<void>
}

export function useGoogleSignIn(): UseGoogleSignInResult {
  const [retryMessage, setRetryMessage] = useState<string | null>(null)

  const handleSignIn = async () => {
    setRetryMessage(null)
    try {
      await signInWithGoogle()
    } catch (error) {
      const code = (error as { code?: string } | undefined)?.code
      if (code && NON_FATAL_ERROR_CODES.has(code)) {
        setRetryMessage('Prihlásenie bolo prerušené. Skúste to znova.')
      } else {
        console.error('Sign-in failed', error)
      }
    }
  }

  return { retryMessage, handleSignIn }
}
