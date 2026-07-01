import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize under an explicit app name (rather than the default '[DEFAULT]'
// app) so that test files which need their own `initializeApp()` call
// against the default app (e.g. src/test/auth.integration.test.ts, which
// connects a raw client SDK instance to the emulators) don't collide with
// this module's side-effectful app initialization on import.
const app = initializeApp(firebaseConfig, 'zoznam-nakupny')

export const auth = getAuth(app)
export const db = getFirestore(app)

if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectAuthEmulator(auth, 'http://localhost:9099')
}
