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
    <div className="screen signin-screen">
      <div className="brand-logo" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width={42}
          height={42}
          fill="none"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      </div>
      <h1 className="brand-title">Zoznam nákupný</h1>
      <p className="brand-subtitle">Spoločný nákupný zoznam pre celú rodinu.</p>
      <button type="button" className="google-btn" onClick={handleSignIn}>
        <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Prihlásiť sa cez Google
      </button>
      {retryMessage && (
        <p role="alert" className="form-error" style={{ marginTop: 20 }}>
          {retryMessage}
        </p>
      )}
    </div>
  )
}
