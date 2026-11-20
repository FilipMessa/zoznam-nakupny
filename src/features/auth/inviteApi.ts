import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type Firestore,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { FAMILY_ID } from '@/constants/family'
import {
  INVITES_COLLECTION_PATH,
  MEMBERS_COLLECTION_PATH,
} from '@/lib/firestorePaths'
import type { InviteDoc, RedeemResult } from './types'

export async function redeemInviteCode(
  uid: string,
  code: string,
  firestore: Firestore = db,
): Promise<RedeemResult> {
  try {
    const inviteRef = doc(firestore, INVITES_COLLECTION_PATH, code)
    const inviteSnap = await getDoc(inviteRef)

    if (!inviteSnap.exists()) {
      return { ok: false, error: 'invalid-code' }
    }

    const inviteData = inviteSnap.data() as InviteDoc
    if (inviteData.familyId !== FAMILY_ID) {
      return { ok: false, error: 'invalid-code' }
    }

    const memberRef = doc(firestore, MEMBERS_COLLECTION_PATH, uid)
    await setDoc(memberRef, { uid, joinedAt: serverTimestamp() })

    return { ok: true }
  } catch {
    return { ok: false, error: 'unknown' }
  }
}
