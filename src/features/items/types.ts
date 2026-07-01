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
}
