import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { setDoc, doc, getDoc, getDocs, collection } from 'firebase/firestore'
import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest'
import { FAMILY_ID } from '@/constants/family'

const OTHER_UID = 'other-user'
const MEMBER_UID = 'member-user'
const NON_MEMBER_UID = 'non-member-user'
const INVITE_CODE = 'ABC123'
const LIST_ID = 'list-1'
const ITEM_ID = 'item-1'
const MEMORY_PATH = `families/${FAMILY_ID}/purchaseMemory`
const MEMORY_ENTRY_ID = 'mlieko'

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'zoznam-nakupny-rules-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  // Seed data as admin, bypassing rules, so tests exercise reads/writes
  // against realistic pre-existing documents.
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, 'families', FAMILY_ID), { name: 'Test Family' })
    await setDoc(doc(db, `families/${FAMILY_ID}/members`, MEMBER_UID), {
      uid: MEMBER_UID,
    })
    await setDoc(doc(db, `families/${FAMILY_ID}/lists`, LIST_ID), {
      name: 'Groceries',
    })
    await setDoc(
      doc(db, `families/${FAMILY_ID}/lists/${LIST_ID}/items`, ITEM_ID),
      { name: 'mlieko', done: false },
    )
    await setDoc(doc(db, MEMORY_PATH, MEMORY_ENTRY_ID), {
      text: 'mlieko',
      purchaseCount: 1,
    })
    await setDoc(doc(db, 'invites', INVITE_CODE), { familyId: FAMILY_ID })
  })
})

describe('firestore.rules', () => {
  describe('unauthenticated client', () => {
    it('cannot read families/{FAMILY_ID}', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      await assertFails(getDoc(doc(db, 'families', FAMILY_ID)))
    })

    it('cannot read or write lists', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      await assertFails(getDoc(doc(db, `families/${FAMILY_ID}/lists`, LIST_ID)))
      await assertFails(
        setDoc(doc(db, `families/${FAMILY_ID}/lists`, 'new-list'), {
          name: 'Nope',
        }),
      )
    })

    it('cannot read or write items', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      await assertFails(
        getDoc(
          doc(db, `families/${FAMILY_ID}/lists/${LIST_ID}/items`, ITEM_ID),
        ),
      )
      await assertFails(
        setDoc(
          doc(db, `families/${FAMILY_ID}/lists/${LIST_ID}/items`, 'new-item'),
          { name: 'nope', done: false },
        ),
      )
    })

    it('cannot read or write the Purchase Memory', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      await assertFails(getDoc(doc(db, MEMORY_PATH, MEMORY_ENTRY_ID)))
      await assertFails(getDocs(collection(db, MEMORY_PATH)))
      await assertFails(
        setDoc(doc(db, MEMORY_PATH, 'chlieb'), { text: 'chlieb' }),
      )
    })

    it('cannot get invites/{code}', async () => {
      const db = testEnv.unauthenticatedContext().firestore()
      await assertFails(getDoc(doc(db, 'invites', INVITE_CODE)))
    })
  })

  describe('signed-in user with no membership doc', () => {
    it('cannot read or write lists or items', async () => {
      const db = testEnv.authenticatedContext(NON_MEMBER_UID).firestore()
      await assertFails(getDoc(doc(db, `families/${FAMILY_ID}/lists`, LIST_ID)))
      await assertFails(
        setDoc(doc(db, `families/${FAMILY_ID}/lists`, 'new-list'), {
          name: 'Nope',
        }),
      )
      await assertFails(
        getDoc(
          doc(db, `families/${FAMILY_ID}/lists/${LIST_ID}/items`, ITEM_ID),
        ),
      )
      await assertFails(
        setDoc(
          doc(db, `families/${FAMILY_ID}/lists/${LIST_ID}/items`, 'new-item'),
          { name: 'nope', done: false },
        ),
      )
    })

    it('cannot read or write the Purchase Memory', async () => {
      const db = testEnv.authenticatedContext(NON_MEMBER_UID).firestore()
      await assertFails(getDoc(doc(db, MEMORY_PATH, MEMORY_ENTRY_ID)))
      await assertFails(getDocs(collection(db, MEMORY_PATH)))
      await assertFails(
        setDoc(doc(db, MEMORY_PATH, 'chlieb'), { text: 'chlieb' }),
      )
      await assertFails(
        setDoc(
          doc(db, MEMORY_PATH, MEMORY_ENTRY_ID),
          { purchaseCount: 99 },
          { merge: true },
        ),
      )
    })

    it('can get a known invite code but cannot list the invites collection', async () => {
      const db = testEnv.authenticatedContext(NON_MEMBER_UID).firestore()
      await assertSucceeds(getDoc(doc(db, 'invites', INVITE_CODE)))
      await assertFails(getDocs(collection(db, 'invites')))
    })

    it('can create its own members doc but not one for another uid', async () => {
      const db = testEnv.authenticatedContext(NON_MEMBER_UID).firestore()
      await assertSucceeds(
        setDoc(doc(db, `families/${FAMILY_ID}/members`, NON_MEMBER_UID), {
          uid: NON_MEMBER_UID,
        }),
      )
      await assertFails(
        setDoc(doc(db, `families/${FAMILY_ID}/members`, OTHER_UID), {
          uid: OTHER_UID,
        }),
      )
    })
  })

  describe('signed-in user with a members/{uid} doc', () => {
    it('can read and write lists and items under the family', async () => {
      const db = testEnv.authenticatedContext(MEMBER_UID).firestore()
      await assertSucceeds(
        getDoc(doc(db, `families/${FAMILY_ID}/lists`, LIST_ID)),
      )
      await assertSucceeds(
        setDoc(doc(db, `families/${FAMILY_ID}/lists`, 'new-list'), {
          name: 'Weekend shop',
        }),
      )
      await assertSucceeds(
        getDoc(
          doc(db, `families/${FAMILY_ID}/lists/${LIST_ID}/items`, ITEM_ID),
        ),
      )
      await assertSucceeds(
        setDoc(
          doc(db, `families/${FAMILY_ID}/lists/${LIST_ID}/items`, 'new-item'),
          { name: 'vajcia', done: false },
        ),
      )
    })

    it('can read and write the Purchase Memory', async () => {
      const db = testEnv.authenticatedContext(MEMBER_UID).firestore()
      await assertSucceeds(getDoc(doc(db, MEMORY_PATH, MEMORY_ENTRY_ID)))
      await assertSucceeds(getDocs(collection(db, MEMORY_PATH)))
      await assertSucceeds(
        setDoc(doc(db, MEMORY_PATH, 'chlieb'), { text: 'chlieb' }),
      )
      await assertSucceeds(
        setDoc(
          doc(db, MEMORY_PATH, MEMORY_ENTRY_ID),
          { purchaseCount: 2 },
          { merge: true },
        ),
      )
    })
  })

  describe('family root and invite documents are never directly writable', () => {
    it('no client can write to families/{FAMILY_ID} root doc', async () => {
      const memberDb = testEnv.authenticatedContext(MEMBER_UID).firestore()
      await assertFails(
        setDoc(doc(memberDb, 'families', FAMILY_ID), { name: 'Hacked' }),
      )

      const unauthDb = testEnv.unauthenticatedContext().firestore()
      await assertFails(
        setDoc(doc(unauthDb, 'families', FAMILY_ID), { name: 'Hacked' }),
      )
    })

    it('no client can write, update or delete invites/{code}', async () => {
      const memberDb = testEnv.authenticatedContext(MEMBER_UID).firestore()
      await assertFails(
        setDoc(doc(memberDb, 'invites', 'new-code'), { familyId: FAMILY_ID }),
      )
      await assertFails(
        setDoc(
          doc(memberDb, 'invites', INVITE_CODE),
          { familyId: 'other-family' },
          { merge: true },
        ),
      )

      const unauthDb = testEnv.unauthenticatedContext().firestore()
      await assertFails(
        setDoc(doc(unauthDb, 'invites', 'new-code'), { familyId: FAMILY_ID }),
      )
    })
  })
})
