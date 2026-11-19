import { randomBytes } from 'node:crypto'
import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { FAMILY_ID } from '../src/constants/family'
import { familyDocPath, inviteDocPath } from '../src/lib/firestorePaths'

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
}

if (getApps().length === 0) {
  initializeApp({ projectId: 'zoznam-nakupny-dev' })
}

const db = getFirestore()

async function seed() {
  const inviteCode = randomBytes(16).toString('hex')

  await db
    .doc(familyDocPath())
    .set({ createdAt: FieldValue.serverTimestamp() }, { merge: true })

  await db.doc(inviteDocPath(inviteCode)).set({
    familyId: FAMILY_ID,
    createdAt: FieldValue.serverTimestamp(),
  })

  console.log('Seed complete.')
  console.log('Invite code:')
  console.log(inviteCode)
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
