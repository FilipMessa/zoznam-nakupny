import type { ShoppingItem } from './types'

export interface SortedItems {
  active: ShoppingItem[]
  done: ShoppingItem[]
}

export function sortItems(items: ShoppingItem[]): SortedItems {
  const active = items
    .filter((item) => item.status === 'active')
    .sort((a, b) => (a.activeOrder ?? 0) - (b.activeOrder ?? 0))

  const done = items
    .filter((item) => item.status === 'done')
    .sort(
      (a, b) =>
        (a.completedAt?.toMillis() ?? 0) - (b.completedAt?.toMillis() ?? 0),
    )

  return { active, done }
}

export interface CompleteItemPatch<T> {
  status: 'done'
  completedAt: T
  completedBy: string
  updatedAt: T
}

// Generic over the "timestamp" value so callers can pass a real Firestore
// serverTimestamp() FieldValue in production while unit tests inject plain
// sentinel values (strings/objects) without pulling in the Firestore
// runtime -- this function never inspects `completedAt`, only forwards it.
export function completeItemPatch<T>(
  _item: ShoppingItem,
  completedBy: string,
  completedAt: T,
): CompleteItemPatch<T> {
  return {
    status: 'done',
    completedAt,
    completedBy,
    updatedAt: completedAt,
  }
}

export interface RestoreItemPatch<T> {
  status: 'active'
  activeOrder: number
  completedAt: null
  completedBy: null
  updatedAt: T
}

export function restoreItemPatch<T>(
  _item: ShoppingItem,
  activeOrder: number,
  updatedAt: T,
): RestoreItemPatch<T> {
  return {
    status: 'active',
    activeOrder,
    completedAt: null,
    completedBy: null,
    updatedAt,
  }
}

export function nextActiveOrder(items: ShoppingItem[]): number {
  const orders = items
    .map((item) => item.activeOrder)
    .filter((order): order is number => order !== null)

  if (orders.length === 0) {
    return 1
  }

  return Math.max(...orders) + 1
}
