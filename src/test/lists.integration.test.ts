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
  collection,
  connectFirestoreEmulator,
  doc,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
  getDoc,
  getDocs,
  getFirestore,
  type QuerySnapshot,
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
import {
  createList,
  generateListId,
  renameList,
  deleteList,
} from '@/features/lists/listApi'

// Exercises listApi's createList/renameList/deleteList against the real
// Auth + Firestore emulators using a genuine signed-in member client (not an
// admin bypass), so these tests also double as proof that firestore.rules
// supports the create/rename/cascade-delete access pattern for a real
// member. Fixture seeding uses withSecurityRulesDisabled, matching
// firestore.rules.test.ts and auth.integration.test.ts, since it writes to
// the same emulator.
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
})

afterEach(async () => {
  await signOut(auth)
})

async function signInAsMember(): Promise<string> {
  const credential = await signInAnonymously(auth)
  const uid = credential.user.uid
  // Grant membership as admin, bypassing rules, exactly as
  // firestore.rules.test.ts and auth.integration.test.ts seed their fixtures.
  await rulesTestEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), `families/${FAMILY_ID}/members`, uid),
      { uid },
    )
  })
  return uid
}

async function seedListAsAdmin(
  listId: string,
  data: { name: string },
): Promise<void> {
  await rulesTestEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), `families/${FAMILY_ID}/lists`, listId),
      data,
    )
  })
}

async function seedItemAsAdmin(
  listId: string,
  itemId: string,
  data: Record<string, unknown>,
): Promise<void> {
  await rulesTestEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(
        context.firestore(),
        `families/${FAMILY_ID}/lists/${listId}/items`,
        itemId,
      ),
      data,
    )
  })
}

async function getListDocAsAdmin(listId: string) {
  let snapshot: DocumentSnapshot<DocumentData> | undefined
  await rulesTestEnv.withSecurityRulesDisabled(async (context) => {
    snapshot = await getDoc(
      doc(context.firestore(), `families/${FAMILY_ID}/lists`, listId),
    )
  })
  if (!snapshot) {
    throw new Error('expected withSecurityRulesDisabled to run its callback')
  }
  return snapshot
}

async function getItemDocsAsAdmin(listId: string) {
  let snapshots: QuerySnapshot<DocumentData> | undefined
  await rulesTestEnv.withSecurityRulesDisabled(async (context) => {
    snapshots = await getDocs(
      collection(
        context.firestore(),
        `families/${FAMILY_ID}/lists/${listId}/items`,
      ),
    )
  })
  if (!snapshots) {
    throw new Error('expected withSecurityRulesDisabled to run its callback')
  }
  return snapshots
}

describe('listApi (emulator)', () => {
  describe('createList', () => {
    it('creates a list doc with the given name and createdBy uid', async () => {
      const uid = await signInAsMember()

      const listId = generateListId(db)

      await createList('Groceries', uid, listId, db)

      const listDoc = await getListDocAsAdmin(listId)
      expect(listDoc.exists()).toBe(true)
      expect(listDoc.data()?.name).toBe('Groceries')
      expect(listDoc.data()?.createdBy).toBe(uid)
      expect(listDoc.data()?.createdAt).toBeTruthy()
    })
  })

  describe('renameList', () => {
    it('updates the name without touching the items subcollection', async () => {
      await signInAsMember()
      await seedListAsAdmin('list-1', { name: 'Groceries' })
      await seedItemAsAdmin('list-1', 'item-1', {
        name: 'mlieko',
        done: false,
      })

      await renameList('list-1', 'Weekend shop', db)

      const listDoc = await getListDocAsAdmin('list-1')
      expect(listDoc.data()?.name).toBe('Weekend shop')

      const itemSnapshots = await getItemDocsAsAdmin('list-1')
      expect(itemSnapshots.size).toBe(1)
      const itemDoc = itemSnapshots.docs[0]
      expect(itemDoc.id).toBe('item-1')
      expect(itemDoc.data()).toEqual({ name: 'mlieko', done: false })
    })
  })

  describe('deleteList', () => {
    it('deletes the list doc and cascades to delete every item, via a real member client', async () => {
      await signInAsMember()
      await seedListAsAdmin('list-1', { name: 'Groceries' })
      await seedItemAsAdmin('list-1', 'item-1', { name: 'mlieko', done: false })
      await seedItemAsAdmin('list-1', 'item-2', { name: 'vajcia', done: false })
      await seedItemAsAdmin('list-1', 'item-3', { name: 'chlieb', done: true })

      // `db` here is the real signed-in member's client instance (connected
      // to the emulator via connectFirestoreEmulator above), not an admin
      // bypass -- this proves firestore.rules' isMember() access pattern
      // supports the cascade-delete batch writes deleteList performs.
      await deleteList('list-1', db)

      const listDoc = await getListDocAsAdmin('list-1')
      expect(listDoc.exists()).toBe(false)

      const itemSnapshots = await getItemDocsAsAdmin('list-1')
      expect(itemSnapshots.empty).toBe(true)
    })
  })
})
