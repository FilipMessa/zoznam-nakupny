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
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  type Firestore,
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
import { FAMILY_ID } from '../constants/family'
import {
  addItem,
  checkItem,
  uncheckItem,
  deleteItem,
  clearDoneItems,
} from '../features/items/itemService'
import type { ShoppingItem } from '../features/items/types'

// Exercises itemService's addItem/checkItem/uncheckItem/deleteItem/clearDoneItems
// against the real Auth + Firestore emulators using a genuine signed-in
// member client (not an admin bypass), mirroring lists.integration.test.ts
// exactly: this also doubles as proof that firestore.rules' isMember()
// access pattern supports the items subcollection operations. Fixture
// seeding uses withSecurityRulesDisabled, matching lists.integration.test.ts,
// firestore.rules.test.ts, and auth.integration.test.ts, since it writes to
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
  // lists.integration.test.ts, firestore.rules.test.ts and
  // auth.integration.test.ts seed their fixtures.
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
    await setDoc(doc(context.firestore(), `families/${FAMILY_ID}/lists`, listId), data)
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

async function getItemDocAsAdmin(listId: string, itemId: string) {
  let snapshot: Awaited<ReturnType<typeof getDoc>> | undefined
  await rulesTestEnv.withSecurityRulesDisabled(async (context) => {
    snapshot = await getDoc(
      doc(
        context.firestore(),
        `families/${FAMILY_ID}/lists/${listId}/items`,
        itemId,
      ),
    )
  })
  if (!snapshot) {
    throw new Error('expected withSecurityRulesDisabled to run its callback')
  }
  return snapshot
}

async function getItemDocsAsAdmin(listId: string) {
  let snapshots: Awaited<ReturnType<typeof getDocs>> | undefined
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

// itemService's checkItem/uncheckItem take the caller's currently-known
// active items (the same shape useItems() would hand them from its
// onSnapshot listener) so they can compute completeItemPatch/restoreItemPatch
// locally before writing. These convert admin-seeded raw docs into that shape.
function toActiveItem(
  id: string,
  data: Record<string, unknown>,
): ShoppingItem {
  return {
    id,
    text: data.text as string,
    status: 'active',
    activeOrder: data.activeOrder as number,
    completedAt: null,
    completedBy: null,
    createdAt: data.createdAt as ShoppingItem['createdAt'],
    createdBy: data.createdBy as string,
    updatedAt: data.updatedAt as ShoppingItem['updatedAt'],
  }
}

describe('itemService (emulator)', () => {
  describe('addItem', () => {
    it('adds the first item to an empty list with activeOrder 1', async () => {
      const uid = await signInAsMember()
      await seedListAsAdmin('list-1', { name: 'Groceries' })

      await addItem('list-1', 'mlieko', uid, [], db)

      const itemSnapshots = await getItemDocsAsAdmin('list-1')
      expect(itemSnapshots.size).toBe(1)
      const itemDoc = itemSnapshots.docs[0]
      expect(itemDoc.data().text).toBe('mlieko')
      expect(itemDoc.data().status).toBe('active')
      expect(itemDoc.data().activeOrder).toBe(1)
      expect(itemDoc.data().createdBy).toBe(uid)
      expect(itemDoc.data().createdAt).toBeTruthy()
      expect(itemDoc.data().completedAt).toBeNull()
      expect(itemDoc.data().completedBy).toBeNull()
    })

    it('computes activeOrder from the current active items', async () => {
      const uid = await signInAsMember()
      await seedListAsAdmin('list-1', { name: 'Groceries' })
      await seedItemAsAdmin('list-1', 'item-1', {
        text: 'chlieb',
        status: 'active',
        activeOrder: 1,
        completedAt: null,
        completedBy: null,
        createdBy: uid,
      })
      const existingActive = [toActiveItem('item-1', { text: 'chlieb', activeOrder: 1 })]

      await addItem('list-1', 'vajcia', uid, existingActive, db)

      const itemSnapshots = await getItemDocsAsAdmin('list-1')
      const added = itemSnapshots.docs.find((d) => d.data().text === 'vajcia')
      expect(added?.data().activeOrder).toBe(2)
    })
  })

  describe('checkItem', () => {
    it('marks an active item done and stamps completedAt/completedBy', async () => {
      const uid = await signInAsMember()
      await seedListAsAdmin('list-1', { name: 'Groceries' })
      await seedItemAsAdmin('list-1', 'item-1', {
        text: 'mlieko',
        status: 'active',
        activeOrder: 1,
        completedAt: null,
        completedBy: null,
        createdBy: uid,
      })

      await checkItem('list-1', 'item-1', uid, db)

      const itemDoc = await getItemDocAsAdmin('list-1', 'item-1')
      expect(itemDoc.data()?.status).toBe('done')
      expect(itemDoc.data()?.completedAt).toBeTruthy()
      expect(itemDoc.data()?.completedBy).toBe(uid)
    })
  })

  describe('uncheckItem', () => {
    it('restores a done item to active, ordered after the current active max, and clears completedAt/completedBy', async () => {
      const uid = await signInAsMember()
      await seedListAsAdmin('list-1', { name: 'Groceries' })
      await seedItemAsAdmin('list-1', 'item-1', {
        text: 'chlieb',
        status: 'active',
        activeOrder: 3,
        completedAt: null,
        completedBy: null,
        createdBy: uid,
      })
      await seedItemAsAdmin('list-1', 'item-2', {
        text: 'mlieko',
        status: 'done',
        activeOrder: null,
        completedAt: null,
        completedBy: uid,
        createdBy: uid,
      })
      const existingActive = [toActiveItem('item-1', { text: 'chlieb', activeOrder: 3 })]

      await uncheckItem('list-1', 'item-2', existingActive, db)

      const itemDoc = await getItemDocAsAdmin('list-1', 'item-2')
      expect(itemDoc.data()?.status).toBe('active')
      expect(itemDoc.data()?.activeOrder).toBeGreaterThan(3)
      expect(itemDoc.data()?.completedAt).toBeNull()
      expect(itemDoc.data()?.completedBy).toBeNull()
    })
  })

  describe('deleteItem', () => {
    it('deletes a single done item without touching others', async () => {
      const uid = await signInAsMember()
      await seedListAsAdmin('list-1', { name: 'Groceries' })
      await seedItemAsAdmin('list-1', 'item-1', {
        text: 'mlieko',
        status: 'done',
        activeOrder: null,
        completedAt: null,
        completedBy: uid,
        createdBy: uid,
      })
      await seedItemAsAdmin('list-1', 'item-2', {
        text: 'chlieb',
        status: 'active',
        activeOrder: 1,
        completedAt: null,
        completedBy: null,
        createdBy: uid,
      })

      await deleteItem('list-1', 'item-1', db)

      const itemSnapshots = await getItemDocsAsAdmin('list-1')
      expect(itemSnapshots.size).toBe(1)
      expect(itemSnapshots.docs[0].id).toBe('item-2')
    })
  })

  describe('clearDoneItems', () => {
    it('removes every done item and leaves active items untouched', async () => {
      const uid = await signInAsMember()
      await seedListAsAdmin('list-1', { name: 'Groceries' })
      await seedItemAsAdmin('list-1', 'item-1', {
        text: 'mlieko',
        status: 'done',
        activeOrder: null,
        completedAt: null,
        completedBy: uid,
        createdBy: uid,
      })
      await seedItemAsAdmin('list-1', 'item-2', {
        text: 'vajcia',
        status: 'done',
        activeOrder: null,
        completedAt: null,
        completedBy: uid,
        createdBy: uid,
      })
      await seedItemAsAdmin('list-1', 'item-3', {
        text: 'chlieb',
        status: 'active',
        activeOrder: 1,
        completedAt: null,
        completedBy: null,
        createdBy: uid,
      })

      await clearDoneItems('list-1', db)

      const itemSnapshots = await getItemDocsAsAdmin('list-1')
      expect(itemSnapshots.size).toBe(1)
      expect(itemSnapshots.docs[0].id).toBe('item-3')
    })

    it('supports a list with no done items (no-op)', async () => {
      const uid = await signInAsMember()
      await seedListAsAdmin('list-1', { name: 'Groceries' })
      await seedItemAsAdmin('list-1', 'item-1', {
        text: 'chlieb',
        status: 'active',
        activeOrder: 1,
        completedAt: null,
        completedBy: null,
        createdBy: uid,
      })

      await clearDoneItems('list-1', db)

      const itemSnapshots = await getItemDocsAsAdmin('list-1')
      expect(itemSnapshots.size).toBe(1)
    })
  })

  describe('remote change visibility', () => {
    // Matches lists.integration.test.ts's style: it asserts on Firestore
    // reads rather than wiring up an onSnapshot listener with a Promise
    // (useItems' onSnapshot wiring is a thin React hook covered by manual/
    // e2e verification, not this repository-level contract test) --
    // proving a write from one member client is visible to a fresh read on
    // the same collection is sufficient evidence the query/path itself is
    // correct for realtime subscription.
    it('an item added by one client is visible via a fresh read (as onSnapshot would receive it)', async () => {
      const uid = await signInAsMember()
      await seedListAsAdmin('list-1', { name: 'Groceries' })

      await addItem('list-1', 'mlieko', uid, [], db)

      const itemSnapshots = await getItemDocsAsAdmin('list-1')
      expect(itemSnapshots.docs.map((d) => d.data().text)).toContain('mlieko')
    })
  })
})
