import {
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import { auth } from '../../lib/firebase'

const POPUP_FALLBACK_ERROR_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
])

function isLikelyMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ) ||
    (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  )
}

function isPopupFallbackError(error: unknown): boolean {
  const code = (error as { code?: string } | undefined)?.code
  return Boolean(code && POPUP_FALLBACK_ERROR_CODES.has(code))
}

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  if (isLikelyMobileBrowser()) {
    await signInWithRedirect(auth, provider)
    return
  }

  try {
    await signInWithPopup(auth, provider)
  } catch (error) {
    if (isPopupFallbackError(error)) {
      await signInWithRedirect(auth, provider)
      return
    }

    throw error
  }
}

export async function completeRedirectSignIn(): Promise<void> {
  await getRedirectResult(auth)
}

export async function signOutUser(): Promise<void> {
  await signOut(auth)
}
