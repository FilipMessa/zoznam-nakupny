import type { Timestamp } from 'firebase/firestore'

export interface ShoppingList {
  id: string
  name: string
  createdAt: Timestamp
  createdBy: string
}
