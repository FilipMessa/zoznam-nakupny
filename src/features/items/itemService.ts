import type { ShoppingItem } from './types'

export interface SortedItems {
  active: ShoppingItem[]
  done: ShoppingItem[]
}

export type ValidateItemTextResult = { ok: true; text: string } | { ok: false }

export function validateItemText(text: string): ValidateItemTextResult {
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    return { ok: false }
  }
  return { ok: true, text: trimmed }
}

export function sortItems(items: ShoppingItem[]): SortedItems {
  const active = items
    .filter((item) => item.status === 'active')
    .sort((a, b) => (a.activeOrder ?? 0) - (b.activeOrder ?? 0))

  const done = items
    .filter((item) => item.status === 'done')
    .sort(
      (a, b) =>
        (b.completedAt?.toMillis() ?? 0) - (a.completedAt?.toMillis() ?? 0),
    )

  return { active, done }
}

// Declared as type aliases (not interfaces) so they are assignable to
// Firestore's UpdateData index-signature type without casts.
export type CompleteItemPatch<T> = {
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

export type RestoreItemPatch<T> = {
  status: 'active'
  activeOrder: number
  completedAt: null
  completedBy: null
  updatedAt: T
}

export function restoreItemPatch<T>(
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

// The id of the last active item present now but absent from `prevIds`,
// i.e. the item that was just appended. null if nothing new appeared.
export function latestNewActiveId(
  prevIds: string[],
  active: ShoppingItem[],
): string | null {
  const prev = new Set(prevIds)
  const added = active.filter((item) => !prev.has(item.id))
  return added.length > 0 ? added[added.length - 1].id : null
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

// Computes the activeOrder an item should take when inserted at `toIndex`
// within `items` (an array that does NOT already contain the item being
// placed) -- the midpoint between its new neighbors, per ADR 0002
// (fractional-index reordering). Shared by `reorderActiveItems` (moving an
// item already in the list) and `insertActiveOrder` (moving an item in from
// elsewhere, e.g. a different List).
function computeInsertionOrder(items: ShoppingItem[], toIndex: number): number {
  if (items.length === 0) {
    return nextActiveOrder(items)
  }

  const prev = items[toIndex - 1]
  const next = items[toIndex]

  if (!prev) {
    // Inserting at the very top of the list.
    const nextOrder = next.activeOrder as number
    if (nextOrder === 0) {
      return -1
    }
    if (nextOrder < 0) {
      return nextOrder * 2
    }
    return nextOrder / 2
  }

  if (!next) {
    // Inserting at the very bottom of the list.
    return nextActiveOrder(items)
  }

  const prevOrder = prev.activeOrder as number
  const nextOrder = next.activeOrder as number
  const midpoint = (prevOrder + nextOrder) / 2

  if (
    !Number.isFinite(midpoint) ||
    Number.isNaN(midpoint) ||
    midpoint <= prevOrder ||
    midpoint >= nextOrder
  ) {
    return prevOrder + Number.EPSILON
  }

  return midpoint
}

// Computes the activeOrder a dragged item should take on after a reorder.
// `fromIndex`/`toIndex` are both positions within `activeItems` as currently
// sorted (i.e. the array the drag interaction observed) -- `toIndex` refers
// to the destination position in the array with the moved item removed, per
// ADR 0002 (fractional-index reordering).
export function reorderActiveItems(
  activeItems: ShoppingItem[],
  fromIndex: number,
  toIndex: number,
): number {
  if (fromIndex === toIndex) {
    return activeItems[fromIndex].activeOrder as number
  }

  const withoutMoved = activeItems.filter((_, index) => index !== fromIndex)

  return computeInsertionOrder(withoutMoved, toIndex)
}

// Computes the activeOrder an item not currently in `destActiveItems` should
// take when inserted at `toIndex` -- the cross-list counterpart of
// `reorderActiveItems`, used when moving an Item into a different List (the
// moved item isn't present in the destination array to filter out).
export function insertActiveOrder(
  destActiveItems: ShoppingItem[],
  toIndex: number,
): number {
  return computeInsertionOrder(destActiveItems, toIndex)
}
