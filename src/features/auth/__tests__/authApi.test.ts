import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auth } from '@/lib/firebase'
import {
  completeRedirectSignIn,
  signInWithGoogle,
  signOutUser,
} from '@/features/auth/authApi'

const firebaseAuthMocks = vi.hoisted(() => {
  const provider = {
    setCustomParameters: vi.fn(),
  }

  return {
    provider,
    GoogleAuthProvider: vi.fn(function MockGoogleAuthProvider() {
      return provider
    }),
    getRedirectResult: vi.fn(),
    signInWithPopup: vi.fn(),
    signInWithRedirect: vi.fn(),
    signOut: vi.fn(),
  }
})

vi.mock('@/lib/firebase', () => ({
  auth: { name: 'test-auth' },
}))

vi.mock('firebase/auth', () => {
  return {
    GoogleAuthProvider: firebaseAuthMocks.GoogleAuthProvider,
    getRedirectResult: firebaseAuthMocks.getRedirectResult,
    signInWithPopup: firebaseAuthMocks.signInWithPopup,
    signInWithRedirect: firebaseAuthMocks.signInWithRedirect,
    signOut: firebaseAuthMocks.signOut,
  }
})

function stubNavigator(userAgent: string, maxTouchPoints = 0) {
  vi.stubGlobal('navigator', {
    userAgent,
    maxTouchPoints,
  })
}

describe('googleAuth', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    firebaseAuthMocks.provider.setCustomParameters.mockReset()
    firebaseAuthMocks.GoogleAuthProvider.mockClear()
    firebaseAuthMocks.getRedirectResult.mockReset()
    firebaseAuthMocks.signInWithPopup.mockReset()
    firebaseAuthMocks.signInWithRedirect.mockReset()
    firebaseAuthMocks.signOut.mockReset()
    stubNavigator(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    )
  })

  it('uses a popup sign-in flow on desktop browsers', async () => {
    firebaseAuthMocks.signInWithPopup.mockResolvedValueOnce({})

    await signInWithGoogle()

    expect(firebaseAuthMocks.signInWithPopup).toHaveBeenCalledWith(
      auth,
      firebaseAuthMocks.provider,
    )
    expect(firebaseAuthMocks.signInWithRedirect).not.toHaveBeenCalled()
    expect(firebaseAuthMocks.provider.setCustomParameters).toHaveBeenCalledWith(
      { prompt: 'select_account' },
    )
  })

  it('uses a redirect sign-in flow on mobile browsers', async () => {
    stubNavigator(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/120 Mobile/15E148 Safari/604.1',
      5,
    )
    firebaseAuthMocks.signInWithRedirect.mockResolvedValueOnce(undefined)

    await signInWithGoogle()

    expect(firebaseAuthMocks.signInWithRedirect).toHaveBeenCalledWith(
      auth,
      firebaseAuthMocks.provider,
    )
    expect(firebaseAuthMocks.signInWithPopup).not.toHaveBeenCalled()
  })

  it('falls back to redirect when the popup is blocked', async () => {
    firebaseAuthMocks.signInWithPopup.mockRejectedValueOnce({
      code: 'auth/popup-blocked',
    })
    firebaseAuthMocks.signInWithRedirect.mockResolvedValueOnce(undefined)

    await signInWithGoogle()

    expect(firebaseAuthMocks.signInWithPopup).toHaveBeenCalledOnce()
    expect(firebaseAuthMocks.signInWithRedirect).toHaveBeenCalledWith(
      auth,
      firebaseAuthMocks.provider,
    )
  })

  it('rethrows non-fallback popup errors', async () => {
    const error = { code: 'auth/popup-closed-by-user' }
    firebaseAuthMocks.signInWithPopup.mockRejectedValueOnce(error)

    await expect(signInWithGoogle()).rejects.toBe(error)

    expect(firebaseAuthMocks.signInWithRedirect).not.toHaveBeenCalled()
  })

  it('completes pending redirect results', async () => {
    firebaseAuthMocks.getRedirectResult.mockResolvedValueOnce(null)

    await completeRedirectSignIn()

    expect(firebaseAuthMocks.getRedirectResult).toHaveBeenCalledWith(auth)
  })

  it('signs out through Firebase Auth', async () => {
    firebaseAuthMocks.signOut.mockResolvedValueOnce(undefined)

    await signOutUser()

    expect(firebaseAuthMocks.signOut).toHaveBeenCalledWith(auth)
  })
})
