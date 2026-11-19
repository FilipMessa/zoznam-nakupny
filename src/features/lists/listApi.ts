import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { createSnapshotMapper } from '@/lib/snapshotMapper'
import { itemsCollectionPath, listsCollectionPath } from '@/lib/firestorePaths'
import { validateListName } from './listService'
import type { ShoppingList } from './types'

// Firestore batched writes are capped at 500 operations; chunk to a safe
// margin below that so a batch that also needs to delete the parent list
// doc in its final chunk never risks exceeding the limit.
const MAX_BATCH_WRITES = 450

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

// Realtime subscription to the Family's Lists, oldest first. Same contract
// as itemApi.subscribeItems (see createSnapshotMapper): `onNext` fires on
// every snapshot with the full array, each List stamped with a client-only
// `pendingSync` flag, and unchanged Lists keep a stable object reference (so
// React.memo on AllListsSection isn't defeated whenever some *other* list
// changes).
export function subscribeLists(
  onNext: (lists: ShoppingList[]) => void,
  firestore: Firestore = db,
): Unsubscribe {
  const listsQuery = query(
    collection(firestore, listsCollectionPath()),
    orderBy('createdAt', 'asc'),
  )
  const mapSnapshot = createSnapshotMapper<ShoppingList>()

  return onSnapshot(
    listsQuery,
    { includeMetadataChanges: true },
    (snapshot) => {
      onNext(mapSnapshot(snapshot))
    },
  )
}

// Mints a list ID without writing anything -- a plain client-side ref id,
// no network round-trip. Lets a caller that already knows it can't wait for
// createList's write to be acknowledged (see useCreateListForm) select and
// display the list immediately, then pass the same id back into createList.
export function generateListId(firestore: Firestore = db): string {
  return doc(collection(firestore, listsCollectionPath())).id
}

export async function createList(
  name: string,
  createdBy: string,
  listId?: string,
  firestore: Firestore = db,
): Promise<string> {
  const result = validateListName(name)
  if (!result.ok) {
    throw new Error('invalid-list-name')
  }

  const listRef = listId
    ? doc(firestore, listsCollectionPath(), listId)
    : doc(collection(firestore, listsCollectionPath()))
  await setDoc(listRef, {
    name: result.name,
    createdBy,
    createdAt: serverTimestamp(),
  })

  return listRef.id
}

export async function renameList(
  listId: string,
  name: string,
  firestore: Firestore = db,
): Promise<void> {
  const result = validateListName(name)
  if (!result.ok) {
    throw new Error('invalid-list-name')
  }

  const listRef = doc(firestore, listsCollectionPath(), listId)
  await updateDoc(listRef, { name: result.name })
}

export async function deleteList(
  listId: string,
  firestore: Firestore = db,
): Promise<void> {
  const listRef = doc(firestore, listsCollectionPath(), listId)
  const itemsSnapshot = await getDocs(
    collection(firestore, itemsCollectionPath(listId)),
  )
  const itemRefs = itemsSnapshot.docs.map((itemDoc) => itemDoc.ref)

  const chunks = chunk(itemRefs, MAX_BATCH_WRITES)
  if (chunks.length === 0) {
    chunks.push([])
  }

  for (let i = 0; i < chunks.length; i += 1) {
    const batch = writeBatch(firestore)
    for (const itemRef of chunks[i]) {
      batch.delete(itemRef)
    }
    if (i === chunks.length - 1) {
      batch.delete(listRef)
    }
    await batch.commit()
  }
}
