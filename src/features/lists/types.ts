import type { Timestamp } from 'firebase/firestore'

export interface ShoppingList {
  id: string
  name: string
  createdAt: Timestamp
  createdBy: string
  /** Client-only: true while this list's latest write hasn't reached the
   * server yet. Never persisted to Firestore. */
  pendingSync?: boolean
}
