// One-time back-fill of the Purchase Memory (docs/adr/0004-purchase-memory-
// catalog.md) from the done Items of every List, run once before the
// suggestions read from it:
//
//   npm run migrate:purchase-memory                 # Firestore emulator
//   GCLOUD_PROJECT=<project-id> npm run migrate:purchase-memory -- --production
//
// Per normalized name: the count is the number of done Items, per List by
// their List; the last purchase is the newest completedAt; the text is the
// newest Item's. Entries are written with a plain set (no increments, no
// merge), so running it again gives the same result -- but it overwrites
// what check-offs counted since, so run it before members start using the
// new version, not after.
import { getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { chunk, MAX_BATCH_WRITES } from '../src/lib/batchChunks'
import {
  itemsCollectionPath,
  LISTS_COLLECTION_PATH,
  PURCHASE_MEMORY_COLLECTION_PATH,
} from '../src/lib/firestorePaths'
import {
  purchaseKey,
  purchaseMemoryEntryId,
} from '../src/features/items/itemService'

const production = process.argv.includes('--production')

if (!production && !process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
}
const projectId = process.env.GCLOUD_PROJECT ?? 'zoznam-nakupny-dev'
if (production && !process.env.GCLOUD_PROJECT) {
  throw new Error('--production needs GCLOUD_PROJECT=<project-id>')
}

if (getApps().length === 0) {
  initializeApp({ projectId })
}

const db = getFirestore()

interface Entry {
  text: string
  purchaseCount: number
  lastPurchasedAt: Timestamp
  countByList: Record<string, number>
}

function purchasedAt(data: FirebaseFirestore.DocumentData): Timestamp {
  const at = data.completedAt ?? data.updatedAt ?? data.createdAt
  return at instanceof Timestamp ? at : Timestamp.fromMillis(0)
}

async function migrate() {
  const entries = new Map<string, Entry>()
  const lists = await db.collection(LISTS_COLLECTION_PATH).get()

  for (const list of lists.docs) {
    const done = await db
      .collection(itemsCollectionPath(list.id))
      .where('status', '==', 'done')
      .get()
    for (const item of done.docs) {
      const data = item.data()
      const text = typeof data.text === 'string' ? data.text.trim() : ''
      const key = purchaseKey(text)
      if (key === '') {
        continue
      }
      const at = purchasedAt(data)
      const entry = entries.get(key) ?? {
        text,
        purchaseCount: 0,
        lastPurchasedAt: at,
        countByList: {},
      }
      entry.purchaseCount += 1
      entry.countByList[list.id] = (entry.countByList[list.id] ?? 0) + 1
      if (at.toMillis() >= entry.lastPurchasedAt.toMillis()) {
        entry.text = text
        entry.lastPurchasedAt = at
      }
      entries.set(key, entry)
    }
  }

  for (const part of chunk(Array.from(entries), MAX_BATCH_WRITES)) {
    const batch = db.batch()
    for (const [key, entry] of part) {
      batch.set(
        db
          .collection(PURCHASE_MEMORY_COLLECTION_PATH)
          .doc(purchaseMemoryEntryId(key)),
        entry,
      )
    }
    await batch.commit()
  }

  console.log(
    `Purchase Memory: ${entries.size} entries from ${lists.size} lists (project ${projectId}${production ? '' : ', emulator'}).`,
  )
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
