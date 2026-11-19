import type { DocumentData } from 'firebase/firestore'

interface DocLike {
  id: string
  data(): DocumentData
  metadata: { hasPendingWrites: boolean }
}

// The slice of a Firestore QuerySnapshot the mapper reads -- structural so
// unit tests can feed plain fakes.
export interface SnapshotLike {
  docs: readonly { id: string }[]
  docChanges(): { type: 'added' | 'modified' | 'removed'; doc: DocLike }[]
}

// Returns a function that turns successive snapshots of one query into the
// full array of domain objects, each stamped with a client-only
// `pendingSync` flag (never persisted to Firestore).
//
// Objects are cached by doc id across snapshots so a document unchanged
// since the last snapshot keeps the same object reference -- otherwise every
// doc gets a brand new object on every snapshot (even ones `docChanges()`
// says didn't change), which defeats React.memo on rows down the tree. A
// snapshot without changes re-emits the previous array as is. One mapper per
// subscription: the cache is that subscription's state.
export function createSnapshotMapper<
  T extends { id: string; pendingSync?: boolean },
>(): (snapshot: SnapshotLike) => T[] {
  const byId = new Map<string, T>()
  let result: T[] = []

  return (snapshot) => {
    const changes = snapshot.docChanges()
    if (changes.length > 0) {
      for (const change of changes) {
        if (change.type === 'removed') {
          byId.delete(change.doc.id)
        } else {
          byId.set(change.doc.id, {
            id: change.doc.id,
            ...(change.doc.data() as Omit<T, 'id'>),
            pendingSync: change.doc.metadata.hasPendingWrites,
          } as T)
        }
      }
      result = snapshot.docs.map((docSnap) => byId.get(docSnap.id)!)
    }
    return result
  }
}
