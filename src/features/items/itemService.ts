import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  setDoc,
  deleteDoc,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { FAMILY_ID } from '../../constants/family'
import { completeItemPatch, restoreItemPatch, nextActiveOrder } from './itemLogic'
import type { ShoppingItem } from './types'

function itemsCollectionPath(listId: string): string {
  return `families/${FAMILY_ID}/lists/${listId}/items`
}

export async function addItem(
  listId: string,
  text: string,
  createdBy: string,
  activeItems: ShoppingItem[],
  firestore: Firestore = db,
): Promise<string> {
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    throw new Error('invalid-item-text')
  }

  const itemRef = doc(collection(firestore, itemsCollectionPath(listId)))
  await setDoc(itemRef, {
    text: trimmed,
    status: 'active',
    activeOrder: nextActiveOrder(activeItems),
    completedAt: null,
    completedBy: null,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return itemRef.id
}

export async function checkItem(
  listId: string,
  itemId: string,
  completedBy: string,
  firestore: Firestore = db,
): Promise<void> {
  const itemRef = doc(firestore, itemsCollectionPath(listId), itemId)
  const patch = completeItemPatch(
    {} as ShoppingItem,
    completedBy,
    serverTimestamp(),
  )
  await updateDoc(itemRef, patch as unknown as Record<string, unknown>)
}

export async function uncheckItem(
  listId: string,
  itemId: string,
  activeItems: ShoppingItem[],
  firestore: Firestore = db,
): Promise<void> {
  const itemRef = doc(firestore, itemsCollectionPath(listId), itemId)
  const patch = restoreItemPatch(
    {} as ShoppingItem,
    nextActiveOrder(activeItems),
    serverTimestamp(),
  )
  await updateDoc(itemRef, patch as unknown as Record<string, unknown>)
}

export async function reorderItem(
  listId: string,
  itemId: string,
  activeOrder: number,
  firestore: Firestore = db,
): Promise<void> {
  const itemRef = doc(firestore, itemsCollectionPath(listId), itemId)
  await updateDoc(itemRef, {
    activeOrder,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteItem(
  listId: string,
  itemId: string,
  firestore: Firestore = db,
): Promise<void> {
  const itemRef = doc(firestore, itemsCollectionPath(listId), itemId)
  await deleteDoc(itemRef)
}

export async function clearDoneItems(
  listId: string,
  firestore: Firestore = db,
): Promise<void> {
  const doneQuery = query(
    collection(firestore, itemsCollectionPath(listId)),
    where('status', '==', 'done'),
  )
  const snapshot = await getDocs(doneQuery)

  if (snapshot.empty) {
    return
  }

  const batch = writeBatch(firestore)
  for (const itemDoc of snapshot.docs) {
    batch.delete(itemDoc.ref)
  }
  await batch.commit()
}
