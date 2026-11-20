import type { ActiveItem, ShoppingItem } from './types'

export interface SortedItems {
  active: ActiveItem[]
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

function hasActiveOrder(item: ShoppingItem): item is ActiveItem {
  return item.activeOrder !== null
}

// The one place an active item's position is narrowed. firestore.rules don't
// forbid an active item without activeOrder (e.g. a hand-edited doc), and
// hiding it would be worse than showing it, so it sorts as order 0. Items
// that have an order are returned as is, keeping their object identity.
function toActiveItem(item: ShoppingItem): ActiveItem {
  return hasActiveOrder(item) ? item : { ...item, activeOrder: 0 }
}

export function sortItems(items: ShoppingItem[]): SortedItems {
  const active = items
    .filter((item) => item.status === 'active')
    .map(toActiveItem)
    .sort((a, b) => a.activeOrder - b.activeOrder)

  const done = items
    .filter((item) => item.status === 'done')
    .sort(
      (a, b) =>
        (b.completedAt?.toMillis() ?? 0) - (a.completedAt?.toMillis() ?? 0),
    )

  return { active, done }
}

export function purchasedSuggestions(
  items: readonly ShoppingItem[],
  text: string,
): ShoppingItem[] {
  const prefix = text.trim().toLocaleLowerCase('sk')
  if (!prefix) {
    return []
  }

  const matches = new Map<string, ShoppingItem>()
  for (const item of items) {
    const name = item.text.trim()
    const key = name.toLocaleLowerCase('sk')
    if (key.startsWith(prefix) && !matches.has(key)) {
      matches.set(key, item)
      if (matches.size === 3) {
        break
      }
    }
  }
  return Array.from(matches.values())
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
// (fractional-index reordering). Used directly when moving an item in from
// elsewhere (e.g. a different List -- the moved item isn't present in the
// destination array to filter out) and by `reorderActiveItems` for moves
// within one list.
export function insertActiveOrder(
  items: ActiveItem[],
  toIndex: number,
): number {
  if (items.length === 0) {
    return nextActiveOrder(items)
  }

  const prev = items[toIndex - 1]
  const next = items[toIndex]

  if (!prev) {
    // Inserting at the very top of the list.
    const nextOrder = next.activeOrder
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

  const prevOrder = prev.activeOrder
  const nextOrder = next.activeOrder
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
  activeItems: ActiveItem[],
  fromIndex: number,
  toIndex: number,
): number {
  if (fromIndex === toIndex) {
    return activeItems[fromIndex].activeOrder
  }

  const withoutMoved = activeItems.filter((_, index) => index !== fromIndex)

  return insertActiveOrder(withoutMoved, toIndex)
}

// Plans a same-list reorder from the ids a drag interaction reports: the new
// activeOrder for `activeId` when dropped on `overId` (an item of `items`),
// or at the very end when `overId` is undefined. null means nothing to write
// (dropped on itself, or either id isn't in `items`).
//
// The over item's index in the full array is passed straight through as
// `toIndex` of the array-with-moved-item-removed; this mirrors
// @dnd-kit/sortable's own `arrayMove(array, from, to)`.
export function planReorder(
  items: ActiveItem[],
  activeId: string,
  overId?: string,
): number | null {
  if (activeId === overId) {
    return null
  }
  const fromIndex = items.findIndex((item) => item.id === activeId)
  const toIndex =
    overId === undefined
      ? items.length - 1
      : items.findIndex((item) => item.id === overId)
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return null
  }
  return reorderActiveItems(items, fromIndex, toIndex)
}
