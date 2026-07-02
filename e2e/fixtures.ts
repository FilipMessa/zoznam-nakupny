import type { Page } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Shared admin-seeding helpers for e2e specs that need a signed-in member
// state. See e2e/mobile-smoke.spec.ts's original header comment for the
// full rationale: there's no way to drive the real Google sign-in popup
// from Playwright, so we seed directly via firebase-admin (bypasses
// security rules, mirroring src/test/*.integration.test.ts's
// withSecurityRulesDisabled) and exchange a custom token for a real
// session through the app's window.__e2eSignIn test hook
// (src/lib/firebase.ts, emulator-only).

declare global {
  interface Window {
    __e2eSignIn?: (customToken: string) => Promise<void>;
  }
}

export const FAMILY_ID = 'default-family';
export const PROJECT_ID = 'zoznam-nakupny-rules-test';
export const FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
export const AUTH_EMULATOR_HOST = '127.0.0.1:9099';

export function getAdminApp(name: string): App {
  process.env.FIRESTORE_EMULATOR_HOST ??= FIRESTORE_EMULATOR_HOST;
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= AUTH_EMULATOR_HOST;

  return (
    getApps().find((a) => a.name === name) ??
    initializeApp({ projectId: PROJECT_ID }, name)
  );
}

export interface SeededFixture {
  uid: string;
  listId: string;
  listName: string;
  customToken: string;
}

export async function seedSignedInMemberWithList(
  adminApp: App,
): Promise<SeededFixture> {
  const uid = `e2e-${randomBytes(6).toString('hex')}`;
  const listId = `list-${randomBytes(6).toString('hex')}`;
  const listName = 'Nákupný zoznam';

  const db = getFirestore(adminApp);
  await db.doc(`families/${FAMILY_ID}/members/${uid}`).set({ uid });
  await db.doc(`families/${FAMILY_ID}/lists/${listId}`).set({
    name: listName,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: uid,
  });

  const customToken = await getAuth(adminApp).createCustomToken(uid);

  return { uid, listId, listName, customToken };
}

export async function signInAsMember(
  page: Page,
  customToken: string,
): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => typeof window.__e2eSignIn === 'function');
  await page.evaluate(
    async (token) => {
      await window.__e2eSignIn!(token);
    },
    customToken,
  );
  // Reload so the app's onAuthStateChanged-driven state machine (App.tsx)
  // re-evaluates from a freshly-authenticated session rather than racing
  // the in-page sign-in call.
  await page.reload();
}
