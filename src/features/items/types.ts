import type { Timestamp } from 'firebase/firestore'

export type ShoppingItemStatus = 'active' | 'done'

export interface ShoppingItem {
  id: string
  text: string
  status: ShoppingItemStatus
  activeOrder: number | null
  completedAt: Timestamp | null
  completedBy: string | null
  createdAt: Timestamp
  createdBy: string
  updatedAt: Timestamp
  /** Client-only: true while this item's latest write hasn't reached the
   * server yet. Never persisted to Firestore. */
  pendingSync?: boolean
}
