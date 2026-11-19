import { readFileSync } from 'node:fs'
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app'
import {
  connectAuthEmulator,
  getAuth,
  signInAnonymously,
  signOut,
  type Auth,
} from 'firebase/auth'
import {
  connectFirestoreEmulator,
  doc,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
} from 'firebase/firestore'
import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  describe,
  it,
  expect,
} from 'vitest'
import { FAMILY_ID } from '@/constants/family'
import { redeemInviteCode } from '@/features/auth/inviteApi'

// This suite exercises inviteService.redeemInviteCode and the
// members/{uid} permission-denied signal against the real Auth + Firestore
// emulators, using the actual client SDK (not @firebase/rules-unit-testing's
// mocked auth contexts) since redeemInviteCode is called by real signed-in
// users in the app. Fixture seeding still uses withSecurityRulesDisabled,
// matching firestore.rules.test.ts, because it writes to the same emulator.
const VALID_INVITE_CODE = 'VALID1'
const WRONG_FAMILY_INVITE_CODE = 'WRONGFAM'
const NONEXISTENT_INVITE_CODE = 'NOPE404'

let rulesTestEnv: RulesTestEnvironment
let app: FirebaseApp
let auth: Auth
let db: Firestore

beforeAll(async () => {
  rulesTestEnv = await initializeTestEnvironment({
    projectId: 'zoznam-nakupny-rules-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })

  // The Auth client SDK requires a non-empty apiKey to construct, even when
  // every request is routed to the emulator, so we pass a dummy value here.
  app = initializeApp({
    apiKey: 'test-api-key',
    projectId: 'zoznam-nakupny-rules-test',
  })
  auth = getAuth(app)
  db = getFirestore(app)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
})

afterAll(async () => {
  await deleteApp(app)
  await rulesTestEnv.cleanup()
})

beforeEach(async () => {
  await rulesTestEnv.clearFirestore()
  await rulesTestEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore()
    await setDoc(doc(adminDb, 'invites', VALID_INVITE_CODE), {
      familyId: FAMILY_ID,
    })
    await setDoc(doc(adminDb, 'invites', WRONG_FAMILY_INVITE_CODE), {
      familyId: 'some-other-family',
    })
  })
})

afterEach(async () => {
  await signOut(auth)
})

async function signInAsNewUser(): Promise<string> {
  const credential = await signInAnonymously(auth)
  return credential.user.uid
}

// withSecurityRulesDisabled()'s callback return value is not forwarded by
// the library (it always resolves to void), so we capture the snapshot via
// a closure variable instead of relying on the callback's return value.
async function getMemberDocAsAdmin(uid: string) {
  let snapshot: DocumentSnapshot<DocumentData> | undefined
  await rulesTestEnv.withSecurityRulesDisabled(async (context) => {
    snapshot = await getDoc(
      doc(context.firestore(), `families/${FAMILY_ID}/members`, uid),
    )
  })
  if (!snapshot) {
    throw new Error('expected withSecurityRulesDisabled to run its callback')
  }
  return snapshot
}

describe('inviteService.redeemInviteCode (emulator)', () => {
  it('creates families/{FAMILY_ID}/members/{uid} for a valid invite code', async () => {
    const uid = await signInAsNewUser()

    const result = await redeemInviteCode(uid, VALID_INVITE_CODE, db)

    expect(result).toEqual({ ok: true })
    const memberDoc = await getMemberDocAsAdmin(uid)
    expect(memberDoc.exists()).toBe(true)
    expect(memberDoc.data()?.uid).toBe(uid)
  })

  it('returns invalid-code and writes nothing for a non-existent invite code', async () => {
    const uid = await signInAsNewUser()

    const result = await redeemInviteCode(uid, NONEXISTENT_INVITE_CODE, db)

    expect(result).toEqual({ ok: false, error: 'invalid-code' })
    const memberDoc = await getMemberDocAsAdmin(uid)
    expect(memberDoc.exists()).toBe(false)
  })

  it('rejects an invite whose familyId does not match FAMILY_ID, without writing', async () => {
    const uid = await signInAsNewUser()

    const result = await redeemInviteCode(uid, WRONG_FAMILY_INVITE_CODE, db)

    expect(result).toEqual({ ok: false, error: 'invalid-code' })
    const memberDoc = await getMemberDocAsAdmin(uid)
    expect(memberDoc.exists()).toBe(false)
  })
})

describe('subscribing to members/{uid} before membership exists', () => {
  it('yields a permission-denied error rather than hanging or throwing synchronously', async () => {
    const uid = await signInAsNewUser()

    const errorCode = await new Promise<string>((resolve, reject) => {
      const unsubscribe = onSnapshot(
        doc(db, `families/${FAMILY_ID}/members`, uid),
        () => {
          unsubscribe()
          reject(new Error('expected permission-denied, got a snapshot'))
        },
        (error) => {
          unsubscribe()
          resolve(error.code)
        },
      )
    })

    expect(errorCode).toBe('permission-denied')
  })
})
