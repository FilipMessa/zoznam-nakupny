import {
  doc,
  onSnapshot,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MEMBERS_COLLECTION_PATH } from '@/lib/firestorePaths'

// Realtime "am I a Member?" check: `onNext(true)` while members/{uid} exists,
// `onNext(false)` while it doesn't.
export function subscribeMembership(
  uid: string,
  onNext: (isMember: boolean) => void,
  firestore: Firestore = db,
): Unsubscribe {
  const memberRef = doc(firestore, MEMBERS_COLLECTION_PATH, uid)

  return onSnapshot(
    memberRef,
    (snapshot) => {
      onNext(snapshot.exists())
    },
    () => {
      // Reading our own not-yet-existing members/{uid} doc is denied by
      // the security rules (isMember() requires the doc to already
      // exist), so permission-denied here is the expected "not a member
      // yet" signal rather than a fatal error.
      onNext(false)
    },
  )
}
