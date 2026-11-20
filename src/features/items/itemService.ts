import type { ActiveItem, PurchaseMemoryEntry, ShoppingItem } from './types'

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

// Fewer typed characters than this suggest nothing: one letter matches too
// much of the Purchase Memory to be useful.
const MIN_SUGGESTION_PREFIX_LENGTH = 2
const MAX_SUGGESTIONS = 3

// The Purchase Memory key of an Item name: whitespace trimmed and collapsed,
// Slovak-locale lowercase, diacritics stripped -- so "salat" and "Šalát"
// are one entry. Quantities and variants are kept: "Mlieko 2x" is not
// "mlieko". Pure strings and no `@/` imports, like the rest of this module,
// so scripts/migrate-purchase-memory.ts can use it under tsx.
export function purchaseKey(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('sk')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

// Firestore caps a document id at 1500 bytes; a UTF-8 code point is at most
// 4 bytes. Keys this long merge on their first 375 code points, which no
// real Item name reaches.
const MAX_ENTRY_ID_CODE_POINTS = 1500 / 4

// The Purchase Memory document id of a key. Deterministic, so two Members
// checking off the same name write to the same document without a
// transaction (ADR 0004). Firestore ids can't contain '/', can't be '.' or
// '..' and can't look like `__x__`; those are percent-escaped, and '%'
// itself always is, so different keys never share an id.
export function purchaseMemoryEntryId(key: string): string {
  const id = Array.from(key)
    .slice(0, MAX_ENTRY_ID_CODE_POINTS)
    .join('')
    .replace(/[%/]/g, (char) => (char === '%' ? '%25' : '%2F'))
  if (id === '.' || id === '..') {
    return id.replace(/\./g, '%2E')
  }
  if (/^__.*__$/.test(id)) {
    return `%5F${id.slice(1)}`
  }
  return id
}

// A word starts after anything that isn't a letter or digit, so "polo"
// finds "mlieko (polotucne)" and "maso" finds "sojove-maso".
const WORD_BOUNDARY = /[^\p{L}\p{N}]/u

// 0 = the whole key starts with the typed text, 1 = a later word does,
// null = no match.
function matchRank(key: string, prefix: string): 0 | 1 | null {
  if (key.startsWith(prefix)) {
    return 0
  }
  for (
    let at = key.indexOf(prefix, 1);
    at !== -1;
    at = key.indexOf(prefix, at + 1)
  ) {
    if (WORD_BOUNDARY.test(key[at - 1])) {
      return 1
    }
  }
  return null
}

// An entry whose serverTimestamp() is still pending was bought just now.
function lastPurchasedMillis(entry: PurchaseMemoryEntry): number {
  return entry.lastPurchasedAt?.toMillis() ?? Number.POSITIVE_INFINITY
}

// What to suggest for `text` typed into the add-item form of List `listId`:
// up to three Purchase Memory entries whose key has a word starting with the
// typed text, minus names already active in that List. A match at the very
// start of the name ranks first, then purchases in that List, then in total,
// then the most recent purchase.
export function purchaseSuggestions(
  entries: readonly PurchaseMemoryEntry[],
  text: string,
  listId: string,
  activeItems: readonly ShoppingItem[],
): PurchaseMemoryEntry[] {
  const prefix = purchaseKey(text)
  if (prefix.length < MIN_SUGGESTION_PREFIX_LENGTH) {
    return []
  }

  const activeKeys = new Set(activeItems.map((item) => purchaseKey(item.text)))
  const matches: { entry: PurchaseMemoryEntry; rank: 0 | 1 }[] = []
  for (const entry of entries) {
    const key = purchaseKey(entry.text)
    const rank = matchRank(key, prefix)
    if (rank !== null && !activeKeys.has(key)) {
      matches.push({ entry, rank })
    }
  }

  return matches
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        (b.entry.countByList[listId] ?? 0) -
          (a.entry.countByList[listId] ?? 0) ||
        b.entry.purchaseCount - a.entry.purchaseCount ||
        lastPurchasedMillis(b.entry) - lastPurchasedMillis(a.entry),
    )
    .slice(0, MAX_SUGGESTIONS)
    .map(({ entry }) => entry)
}

// The done Item a suggestion should bring back instead of adding a
// duplicate: the first of `doneItems` (newest first, as sortItems orders
// them) with the same Purchase Memory key as `text`.
export function purchasedItemFor(
  doneItems: readonly ShoppingItem[],
  text: string,
): ShoppingItem | undefined {
  const key = purchaseKey(text)
  return doneItems.find((item) => purchaseKey(item.text) === key)
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
