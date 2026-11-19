import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { FAMILY_ID } from '@/constants/family'
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

    // See useItems.ts's identical cache -- keeps unchanged lists'
    // object references stable across snapshots so React.memo on
    // AllListsSection isn't defeated whenever some *other* list changes.
    const listsById = new Map<string, ShoppingList>()

    const unsubscribe = onSnapshot(
      listsQuery,
      { includeMetadataChanges: true },
      (snapshot) => {
        const changes = snapshot.docChanges()
        if (changes.length === 0) {
          setListsLoading(false)
          return
        }

        for (const change of changes) {
          if (change.type === 'removed') {
            listsById.delete(change.doc.id)
          } else {
            listsById.set(change.doc.id, {
              id: change.doc.id,
              ...(change.doc.data() as Omit<ShoppingList, 'id'>),
              pendingSync: change.doc.metadata.hasPendingWrites,
            })
          }
        }
        setLists(snapshot.docs.map((docSnap) => listsById.get(docSnap.id)!))
        setListsLoading(false)
      },
    )

    return unsubscribe
  }, [])

  return { lists, listsLoading }
}
