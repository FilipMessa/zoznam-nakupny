import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { FAMILY_ID } from '@/constants/family'
import type { ShoppingItem } from './types'

export interface UseItemsResult {
  items: ShoppingItem[]
  itemsLoading: boolean
}

export function useItems(listId: string): UseItemsResult {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(true)

  useEffect(() => {
    const itemsQuery = query(
      collection(db, `families/${FAMILY_ID}/lists/${listId}/items`),
      orderBy('createdAt', 'asc'),
    )

    // Reused across snapshots (reset whenever this effect re-subscribes for
    // a new listId) so a document unchanged since the last snapshot keeps
    // the same object reference -- otherwise every doc gets a brand new
    // object on every snapshot (even ones `docChanges()` says didn't
    // change), which defeats React.memo on item rows down the tree: they'd
    // see a "new" item prop and re-render regardless of whether anything in
    // it actually changed.
    const itemsById = new Map<string, ShoppingItem>()

    const unsubscribe = onSnapshot(
      itemsQuery,
      { includeMetadataChanges: true },
      (snapshot) => {
        const changes = snapshot.docChanges()
        if (changes.length === 0) {
          setItemsLoading(false)
          return
        }

        for (const change of changes) {
          if (change.type === 'removed') {
            itemsById.delete(change.doc.id)
          } else {
            itemsById.set(change.doc.id, {
              id: change.doc.id,
              ...(change.doc.data() as Omit<ShoppingItem, 'id'>),
              pendingSync: change.doc.metadata.hasPendingWrites,
            })
          }
        }
        setItems(snapshot.docs.map((docSnap) => itemsById.get(docSnap.id)!))
        setItemsLoading(false)
      },
    )

    return unsubscribe
  }, [listId])

  return { items, itemsLoading }
}
