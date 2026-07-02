import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { FAMILY_ID } from '../../constants/family'
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

    const unsubscribe = onSnapshot(
      itemsQuery,
      { includeMetadataChanges: true },
      (snapshot) => {
        setItems(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<ShoppingItem, 'id'>),
            pendingSync: docSnap.metadata.hasPendingWrites,
          })),
        )
        setItemsLoading(false)
      },
    )

    return unsubscribe
  }, [listId])

  return { items, itemsLoading }
}
