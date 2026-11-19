import {
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { isLikelyMobileBrowser, isPopupFallbackError } from './authService'

function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  return isLikelyMobileBrowser(navigator.userAgent, navigator.maxTouchPoints)
}

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  if (isMobileBrowser()) {
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
