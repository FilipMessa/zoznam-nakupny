import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { FAMILY_ID } from '../../constants/family'
import type { ShoppingList } from './types'

export interface UseListsResult {
  lists: ShoppingList[]
  listsLoading: boolean
}

export function useLists(): UseListsResult {
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [listsLoading, setListsLoading] = useState(true)

  useEffect(() => {
    const listsQuery = query(
      collection(db, `families/${FAMILY_ID}/lists`),
      orderBy('createdAt', 'asc'),
    )

    const unsubscribe = onSnapshot(
      listsQuery,
      { includeMetadataChanges: true },
      (snapshot) => {
        setLists(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<ShoppingList, 'id'>),
            pendingSync: docSnap.metadata.hasPendingWrites,
          })),
        )
        setListsLoading(false)
      },
    )

    return unsubscribe
  }, [])

  return { lists, listsLoading }
}
