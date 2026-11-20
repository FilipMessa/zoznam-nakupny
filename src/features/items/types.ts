import type { Timestamp } from 'firebase/firestore'

export type ShoppingItemStatus = 'active' | 'done'

/** Why adding an item failed (shown by AddItemForm). */
export type AddItemError = 'unknown'

export type MoveItemResult =
  { ok: true } | { ok: false; reason: 'source-missing' | 'dest-list-missing' }

export interface ShoppingItem {
  id: string
  text: string
  status: ShoppingItemStatus
  activeOrder: number | null
  completedAt: Timestamp | null
  completedBy: string | null
  createdAt: Timestamp
  createdByName?: string
  createdBy: string
  updatedAt: Timestamp
  /** Client-only: true while this item's latest write hasn't reached the
   * server yet. Never persisted to Firestore. */
  pendingSync?: boolean
}

/** A ShoppingItem in the active section, which always has a position. */
export type ActiveItem = ShoppingItem & { activeOrder: number }
