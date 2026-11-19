import type { Page } from '@playwright/test'
import { randomBytes } from 'node:crypto'
import { getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { SELECTED_LIST_STORAGE_KEY } from '../src/constants/storage'
import {
  itemDocPath,
  listDocPath,
  memberDocPath,
} from '../src/lib/firestorePaths'

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
    __e2eSignIn?: (customToken: string) => Promise<void>
  }
}

export const PROJECT_ID = 'zoznam-nakupny-rules-test'
export const FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
export const AUTH_EMULATOR_HOST = '127.0.0.1:9099'

export function getAdminApp(name: string): App {
  process.env.FIRESTORE_EMULATOR_HOST ??= FIRESTORE_EMULATOR_HOST
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= AUTH_EMULATOR_HOST

  return (
    getApps().find((a) => a.name === name) ??
    initializeApp({ projectId: PROJECT_ID }, name)
  )
}

export interface SeededFixture {
  uid: string
  listId: string
  listName: string
  customToken: string
}

export async function seedSignedInMemberWithList(
  adminApp: App,
): Promise<SeededFixture> {
  const uid = `e2e-${randomBytes(6).toString('hex')}`
  const listId = `list-${randomBytes(6).toString('hex')}`
  const listName = 'Nákupný zoznam'

  const db = getFirestore(adminApp)
  await db.doc(memberDocPath(uid)).set({ uid })
  await db.doc(listDocPath(listId)).set({
    name: listName,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: uid,
  })

  const customToken = await getAuth(adminApp).createCustomToken(uid)

  return { uid, listId, listName, customToken }
}

export interface TwoListsFixture {
  uid: string
  listAId: string
  listAName: string
  listBId: string
  listBName: string
  itemId: string
  itemText: string
  customToken: string
}

// Seeds a member with two Lists, one Item in the first -- for e2e specs
// that need to move an Item between Lists (e.g. the All Lists screen's
// cross-list drag). Mirrors seedSignedInMemberWithList's admin-bypass
// seeding pattern.
export async function seedSignedInMemberWithTwoLists(
  adminApp: App,
): Promise<TwoListsFixture> {
  const uid = `e2e-${randomBytes(6).toString('hex')}`
  const listAId = `list-${randomBytes(6).toString('hex')}`
  const listBId = `list-${randomBytes(6).toString('hex')}`
  // Random suffixes, not fixed names -- FAMILY_ID is a fixed single-tenant
  // constant (see signInAsMember's comment above), so every list ever
  // seeded against a given emulator instance is visible to every test.
  // Fixed names risk an accessible-name collision if this spec (or a
  // future one reusing these names) ever runs more than once against the
  // same non-freshly-cleared emulator, e.g. during local iterative
  // debugging rather than a fresh `emulators:exec` run per test.
  const listAName = `Potraviny ${randomBytes(3).toString('hex')}`
  const listBName = `Drogéria ${randomBytes(3).toString('hex')}`
  const itemId = `item-${randomBytes(6).toString('hex')}`
  const itemText = `mlieko-${randomBytes(3).toString('hex')}`

  const db = getFirestore(adminApp)
  await db.doc(memberDocPath(uid)).set({ uid })
  await db.doc(listDocPath(listAId)).set({
    name: listAName,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: uid,
  })
  await db.doc(listDocPath(listBId)).set({
    name: listBName,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: uid,
  })
  await db.doc(itemDocPath(listAId, itemId)).set({
    text: itemText,
    status: 'active',
    activeOrder: 1,
    completedAt: null,
    completedBy: null,
    createdBy: uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  const customToken = await getAuth(adminApp).createCustomToken(uid)

  return {
    uid,
    listAId,
    listAName,
    listBId,
    listBName,
    itemId,
    itemText,
    customToken,
  }
}

export async function signInAsMember(
  page: Page,
  customToken: string,
  listId?: string,
): Promise<void> {
  await page.goto('/')
  await page.waitForFunction(() => typeof window.__e2eSignIn === 'function')
  await page.evaluate(async (token) => {
    await window.__e2eSignIn!(token)
  }, customToken)
  if (listId) {
    // FAMILY_ID is a fixed single-tenant constant (see CLAUDE.md), so every
    // member -- including ones seeded by other tests still holding data in
    // this same emulator -- sees every list ever created. Without pinning
    // the selection, the app's fallback ("no persisted selection yet" ->
    // oldest list) would pick whichever list happens to be first, not the
    // one this test just seeded. Persisting the selection up front, the way
    // useSelectedListId itself does after a real selection, makes each test
    // deterministic regardless of what other tests left behind.
    await page.evaluate(([key, id]) => window.localStorage.setItem(key, id), [
      SELECTED_LIST_STORAGE_KEY,
      listId,
    ] as const)
  }
  // Reload so the app's onAuthStateChanged-driven state machine (App.tsx)
  // re-evaluates from a freshly-authenticated session rather than racing
  // the in-page sign-in call.
  await page.reload()
}
