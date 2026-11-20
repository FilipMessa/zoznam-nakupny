import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  setDoc,
  deleteDoc,
  deleteField,
  increment,
  where,
  writeBatch,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { createSnapshotMapper } from '@/lib/snapshotMapper'
import { chunk, MAX_BATCH_WRITES } from '@/lib/batchChunks'
import {
  itemsCollectionPath,
  LISTS_COLLECTION_PATH,
  PURCHASE_MEMORY_COLLECTION_PATH,
} from '@/lib/firestorePaths'
import {
  completeItemPatch,
  restoreItemPatch,
  nextActiveOrder,
  purchaseKey,
  purchaseMemoryEntryId,
  validateItemText,
} from './itemService'
import type { MoveItemResult, PurchaseMemoryEntry, ShoppingItem } from './types'

export interface ItemAuthor {
  uid: string
  displayName?: string | null
}

// Realtime subscription to a List's Items, oldest first. Calls `onNext` on
// every snapshot (including metadata-only ones, hence
// `includeMetadataChanges`) with the full item array -- see
// createSnapshotMapper for the pendingSync stamp and reference stability.
export function subscribeItems(
  listId: string,
  onNext: (items: ShoppingItem[]) => void,
  firestore: Firestore = db,
): Unsubscribe {
  const itemsQuery = query(
    collection(firestore, itemsCollectionPath(listId)),
    orderBy('createdAt', 'asc'),
  )
  const mapSnapshot = createSnapshotMapper<ShoppingItem>()

  return onSnapshot(
    itemsQuery,
    { includeMetadataChanges: true },
    (snapshot) => {
      onNext(mapSnapshot(snapshot))
    },
  )
}

// Realtime subscription to the whole Purchase Memory (ADR 0004), in no
// particular order -- purchaseSuggestions ranks it. Same snapshot mapping as
// subscribeItems: a pending check-off shows up at once, with a null
// lastPurchasedAt until the server time is known.
export function subscribePurchaseMemory(
  onNext: (entries: PurchaseMemoryEntry[]) => void,
  firestore: Firestore = db,
): Unsubscribe {
  const mapSnapshot = createSnapshotMapper<PurchaseMemoryEntry>()

  return onSnapshot(
    collection(firestore, PURCHASE_MEMORY_COLLECTION_PATH),
    { includeMetadataChanges: true },
    (snapshot) => {
      onNext(mapSnapshot(snapshot))
    },
  )
}

export async function addItem(
  listId: string,
  text: string,
  author: ItemAuthor,
  activeItems: ShoppingItem[],
  firestore: Firestore = db,
): Promise<string> {
  const result = validateItemText(text)
  if (!result.ok) {
    throw new Error('invalid-item-text')
  }

  const itemRef = doc(collection(firestore, itemsCollectionPath(listId)))
  await setDoc(itemRef, {
    text: result.text,
    status: 'active',
    activeOrder: nextActiveOrder(activeItems),
    completedAt: null,
    completedBy: null,
    createdBy: author.uid,
    ...(author.displayName?.trim() && {
      createdByName: author.displayName.trim(),
    }),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return itemRef.id
}

// Checks an Item off and counts the purchase in the Purchase Memory, in one
// batch so the two can't diverge, and offline the batch simply queues
// (ADR 0004). `text` is the Item's current text, which picks the entry and
// becomes its displayed spelling. The counts are increment()s, so two
// Members checking off the same name at once both count. Nothing ever
// decrements them: unchecking, deleting and clearing leave the entry alone.
export async function checkItem(
  listId: string,
  itemId: string,
  text: string,
  completedBy: string,
  firestore: Firestore = db,
): Promise<void> {
  const batch = writeBatch(firestore)
  batch.update(
    doc(firestore, itemsCollectionPath(listId), itemId),
    completeItemPatch(completedBy, serverTimestamp()),
  )
  const key = purchaseKey(text)
  // Only a hand-edited blank Item has no key; it isn't worth remembering.
  if (key !== '') {
    batch.set(
      doc(
        firestore,
        PURCHASE_MEMORY_COLLECTION_PATH,
        purchaseMemoryEntryId(key),
      ),
      {
        text: text.trim(),
        purchaseCount: increment(1),
        lastPurchasedAt: serverTimestamp(),
        countByList: { [listId]: increment(1) },
      },
      { merge: true },
    )
  }
  await batch.commit()
}

export async function uncheckItem(
  listId: string,
  itemId: string,
  activeItems: ShoppingItem[],
  firestore: Firestore = db,
): Promise<void> {
  const itemRef = doc(firestore, itemsCollectionPath(listId), itemId)
  await updateDoc(
    itemRef,
    restoreItemPatch(nextActiveOrder(activeItems), serverTimestamp()),
  )
}

// Brings a done Item back from the Done section because a Member picked its
// suggestion: like uncheckItem, plus the Member who added it now becomes its
// author (the avatar shows who asked for it this time).
export async function readdPurchasedItem(
  listId: string,
  itemId: string,
  author: ItemAuthor,
  activeItems: ShoppingItem[],
  firestore: Firestore = db,
): Promise<void> {
  const itemRef = doc(firestore, itemsCollectionPath(listId), itemId)
  await updateDoc(itemRef, {
    ...restoreItemPatch(nextActiveOrder(activeItems), serverTimestamp()),
    createdBy: author.uid,
    createdByName: author.displayName?.trim() || deleteField(),
  })
}

export async function editItemText(
  listId: string,
  itemId: string,
  text: string,
  firestore: Firestore = db,
): Promise<void> {
  const result = validateItemText(text)
  if (!result.ok) {
    throw new Error('invalid-item-text')
  }

  const itemRef = doc(firestore, itemsCollectionPath(listId), itemId)
  await updateDoc(itemRef, {
    text: result.text,
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

  // Chunked like deleteList: months of an uncleared Done section can exceed one
  // batch's write limit.
  for (const docs of chunk(snapshot.docs, MAX_BATCH_WRITES)) {
    const batch = writeBatch(firestore)
    for (const itemDoc of docs) {
      batch.delete(itemDoc.ref)
    }
    await batch.commit()
  }
}

// Moves an Item to a different List, preserving its identity (same doc id,
// same createdBy/createdAt) -- this is a move, not a re-creation. There is
// no `listId` field on ShoppingItem (list membership is purely the
// subcollection path), so a cross-list move is unavoidably delete-in-source
// + create-in-dest.
//
// Deliberately a runTransaction, not writeBatch like every other multi-op
// write in this file (clearDoneItems above, listApi.ts's deleteList).
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
  const sourceItemRef = doc(
    firestore,
    itemsCollectionPath(sourceListId),
    item.id,
  )
  const destListRef = doc(firestore, LISTS_COLLECTION_PATH, destListId)
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
      ...(item.createdByName && { createdByName: item.createdByName }),
      createdAt: item.createdAt,
      updatedAt: serverTimestamp(),
    })

    return { ok: true }
  })
}
