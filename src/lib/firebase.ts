import { initializeApp } from 'firebase/app'
import {
  connectAuthEmulator,
  getAuth,
  signInWithCustomToken,
} from 'firebase/auth'
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

declare global {
  interface Window {
    __e2eSignIn?: (customToken: string) => Promise<void>
  }
}

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

// jsdom (Vitest, `import.meta.env.MODE === 'test'`) has no IndexedDB, so
// persistent offline cache would throw there. Real browser builds get it so
// reads/writes keep working offline.
export const db =
  import.meta.env.MODE === 'test'
    ? getFirestore(app)
    : initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      })

if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080)
  // `disableWarnings` suppresses the Auth SDK's fixed-to-bottom "Running in
  // emulator mode" banner. That banner otherwise overlaps the app's own
  // sticky bottom add-item bar (Phase 7 one-screen mobile layout) and
  // intercepts pointer events meant for it. Emulator-only, so this can never
  // affect a production build.
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })

  // E2E test hook only: lets Playwright exchange an admin-minted custom
  // token for a real signed-in session in the browser (see
  // e2e/mobile-smoke.spec.ts). Gated behind the same emulator flag so it
  // can never be reached in a production build.
  window.__e2eSignIn = (token: string) =>
    signInWithCustomToken(auth, token).then(() => undefined)
}
