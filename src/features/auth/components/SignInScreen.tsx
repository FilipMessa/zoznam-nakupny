import { useState } from 'react'
import { signInWithGoogle } from '../googleAuth'

const NON_FATAL_ERROR_CODES = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/popup-blocked',
])

export function SignInScreen() {
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

  return (
    <div>
      <h1>Zoznam nákupný</h1>
      <p>Prihláste sa a pokračujte.</p>
      <button type="button" onClick={handleSignIn}>
        Prihlásiť sa cez Google
      </button>
      {retryMessage && <p role="alert">{retryMessage}</p>}
    </div>
  )
}
