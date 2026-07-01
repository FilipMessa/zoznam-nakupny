import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { FAMILY_ID } from '../../constants/family'
import { validateListName } from './listCrud'

// Firestore batched writes are capped at 500 operations; chunk to a safe
// margin below that so a batch that also needs to delete the parent list
// doc in its final chunk never risks exceeding the limit.
const MAX_BATCH_WRITES = 450

function listsCollectionPath(): string {
  return `families/${FAMILY_ID}/lists`
}

function itemsCollectionPath(listId: string): string {
  return `families/${FAMILY_ID}/lists/${listId}/items`
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

export async function createList(
  name: string,
  createdBy: string,
  firestore: Firestore = db,
): Promise<string> {
  const result = validateListName(name)
  if (!result.ok) {
    throw new Error('invalid-list-name')
  }

  const listRef = doc(collection(firestore, listsCollectionPath()))
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
