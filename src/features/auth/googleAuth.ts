import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { auth } from '../../lib/firebase'

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider()
  await signInWithPopup(auth, provider)
}

export async function signOutUser(): Promise<void> {
  await signOut(auth)
}
