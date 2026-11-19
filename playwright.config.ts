import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  // Always a single worker, not just in CI: several specs (all-lists-drag,
  // offline-sync) drive real pointer/network timing against one shared dev
  // server + emulator pair, and running multiple browser workers
  // concurrently against that same pair introduces CPU contention that
  // makes those specs flaky (observed directly -- a dnd-kit drag simulation
  // that passed 3/3 in isolation intermittently failed under 4 parallel
  // workers). Slower, but deterministic.
  workers: 1,
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    // e2e/mobile-smoke.spec.ts needs a signed-in member state, which it
    // reaches via the Auth + Firestore emulators (started separately with
    // `firebase emulators:start`, matching src/test/*.integration.test.ts).
    // Vite merges VITE_-prefixed process.env values into import.meta.env
    // ahead of any .env file, so setting these here is enough to flip
    // src/lib/firebase.ts's `VITE_USE_FIREBASE_EMULATOR` branch on for the
    // dev server this config spawns, without needing a dedicated env file.
    // The existing unauthenticated e2e/smoke.spec.ts is unaffected: it never
    // triggers a real auth/Firestore call, so pointing the client SDK at the
    // emulators is a no-op for it.
    env: {
      VITE_FIREBASE_API_KEY: 'test-api-key',
      VITE_FIREBASE_PROJECT_ID: 'zoznam-nakupny-rules-test',
      VITE_FIREBASE_AUTH_DOMAIN: 'zoznam-nakupny-rules-test.firebaseapp.com',
      VITE_FIREBASE_STORAGE_BUCKET: 'zoznam-nakupny-rules-test.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
      VITE_FIREBASE_APP_ID: '1:000000000000:web:0000000000000000000000',
      VITE_USE_FIREBASE_EMULATOR: 'true',
    },
  },
  use: { baseURL: 'http://localhost:5173' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
})
