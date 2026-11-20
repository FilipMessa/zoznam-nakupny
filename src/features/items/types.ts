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

/** One entry of the Family's Purchase Memory (CONTEXT.md,
 * docs/adr/0004-purchase-memory-catalog.md): a normalized Item name someone
 * has bought, with how often and when. The doc id is
 * `purchaseMemoryEntryId(purchaseKey(text))`. */
export interface PurchaseMemoryEntry {
  id: string
  /** The most recently used spelling. */
  text: string
  purchaseCount: number
  /** null while a check-off's serverTimestamp() hasn't been resolved yet. */
  lastPurchasedAt: Timestamp | null
  /** Purchases per List id; a deleted List's count simply stays. */
  countByList: Record<string, number>
  /** Client-only, see ShoppingItem.pendingSync. */
  pendingSync?: boolean
}
