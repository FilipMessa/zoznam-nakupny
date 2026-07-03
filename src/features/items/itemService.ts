import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
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

function listDocPath(): string {
  return `families/${FAMILY_ID}/lists`
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

export async function editItemText(
  listId: string,
  itemId: string,
  text: string,
  firestore: Firestore = db,
): Promise<void> {
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    throw new Error('invalid-item-text')
  }

  const itemRef = doc(firestore, itemsCollectionPath(listId), itemId)
  await updateDoc(itemRef, {
    text: trimmed,
    updatedAt: serverTimestamp(),
  })
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

export type MoveItemResult =
  | { ok: true }
  | { ok: false; reason: 'source-missing' | 'dest-list-missing' }

// Moves an Item to a different List, preserving its identity (same doc id,
// same createdBy/createdAt) -- this is a move, not a re-creation. There is
// no `listId` field on ShoppingItem (list membership is purely the
// subcollection path), so a cross-list move is unavoidably delete-in-source
// + create-in-dest.
//
// Deliberately a runTransaction, not writeBatch like every other multi-op
// write in this file (clearDoneItems above, listService.ts's deleteList).
// A plain batch has two race windows this operation can actually hit:
//   1. Two members move the same item to two different lists at once --
//      deleteDoc is idempotent and the two set()s land on different
//      collection paths, so both batches would succeed independently,
//      silently duplicating the item across two lists.
//   2. A member moves an item into a list another member deletes at the
//      same moment -- ADR 0001's cascade delete only touches items that
//      existed at delete time, so a plain batch would resurrect an item
//      under a now-gone list path, invisible forever.
// Re-checking both the source item and the dest list still exist inside the
// transaction closes both races; on failure we return a typed result
// instead of throwing, since a concurrent move/delete elsewhere is an
// expected, recoverable outcome, not an application error.
export async function moveItemToList(
  sourceListId: string,
  destListId: string,
  item: ShoppingItem,
  destActiveOrder: number,
  firestore: Firestore = db,
): Promise<MoveItemResult> {
  const sourceItemRef = doc(firestore, itemsCollectionPath(sourceListId), item.id)
  const destListRef = doc(firestore, listDocPath(), destListId)
  const destItemRef = doc(firestore, itemsCollectionPath(destListId), item.id)

  return runTransaction(firestore, async (transaction) => {
    const sourceSnap = await transaction.get(sourceItemRef)
    if (!sourceSnap.exists()) {
      return { ok: false, reason: 'source-missing' }
    }

    const destListSnap = await transaction.get(destListRef)
    if (!destListSnap.exists()) {
      return { ok: false, reason: 'dest-list-missing' }
    }

    transaction.delete(sourceItemRef)
    transaction.set(destItemRef, {
      text: item.text,
      status: item.status,
      activeOrder: destActiveOrder,
      completedAt: item.completedAt,
      completedBy: item.completedBy,
      createdBy: item.createdBy,
      createdAt: item.createdAt,
      updatedAt: serverTimestamp(),
    })

    return { ok: true }
  })
}
