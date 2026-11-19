import {
  insertActiveOrder,
  reorderActiveItems,
} from '@/features/items/itemService'
import type { MoveItemResult, ShoppingItem } from '@/features/items/types'
import type { ShoppingList } from '@/features/lists/types'

export interface DoneItemWithOrigin {
  item: ShoppingItem
  listId: string
  listName: string
}

// Iterates over `lists` (the live source of truth from useLists()), never
// over doneItemsByListId's own keys -- that map is a registry nothing ever
// deletes from when an AllListsSection unmounts, so after a list is
// hard-deleted (ADR-0001) a stale entry could still be sitting in it.
export function mergeDoneItems(
  lists: ShoppingList[],
  doneItemsByListId: Map<string, ShoppingItem[]>,
): DoneItemWithOrigin[] {
  const merged: DoneItemWithOrigin[] = []

  for (const list of lists) {
    const items = doneItemsByListId.get(list.id) ?? []
    for (const item of items) {
      merged.push({ item, listId: list.id, listName: list.name })
    }
  }

  return merged.sort(
    (a, b) =>
      (b.item.completedAt?.toMillis() ?? 0) -
      (a.item.completedAt?.toMillis() ?? 0),
  )
}

export const LIST_COLOR_PALETTE = [
  'blue',
  'plum',
  'teal',
  'amber',
  'rose',
  'sage',
  'sky',
  'mauve',
] as const

export interface ListColor {
  solid: string
  subtle: string
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function listColorFor(listId: string): ListColor {
  const hue = LIST_COLOR_PALETTE[hashString(listId) % LIST_COLOR_PALETTE.length]
  return { solid: `${hue}.solid`, subtle: `${hue}.subtle` }
}

type MoveConflictReason = Exclude<MoveItemResult, { ok: true }>['reason']

const MESSAGES: Record<MoveConflictReason, string> = {
  'source-missing': 'Položku medzičasom presunul niekto iný.',
  'dest-list-missing': 'Cieľový zoznam už neexistuje.',
}

export function moveConflictMessage(reason: MoveConflictReason): string {
  return MESSAGES[reason]
}

// Prefixes for the cross-list drop targets (a list's header, and the
// empty-state body) -- namespaced so they can never collide with a real
// Firestore item id. AllListsSection registers droppables with these ids and
// resolveDrop parses them back out of `over.id`.
export const LIST_HEADER_DROPPABLE_PREFIX = 'list-header-'
export const LIST_BODY_DROPPABLE_PREFIX = 'list-body-'

// Collapsed-section state is a Set of list ids (everything starts expanded);
// these return a new Set, or the same one when nothing changes so React
// can bail out of the update.
export function toggleCollapsed(
  collapsed: ReadonlySet<string>,
  listId: string,
): Set<string> {
  const next = new Set(collapsed)
  if (next.has(listId)) {
    next.delete(listId)
  } else {
    next.add(listId)
  }
  return next
}

export function expandListId(
  collapsed: ReadonlySet<string>,
  listId: string,
): ReadonlySet<string> {
  if (!collapsed.has(listId)) {
    return collapsed
  }
  const next = new Set(collapsed)
  next.delete(listId)
  return next
}

// Resolves a drop target's destination List id, or null if `overId` isn't a
// recognised drop target at all. `undefined` toIndex means "append to the
// end" (dropped on a list's collapsed header, empty body, or past its last
// item).
export function resolveDrop(
  overId: string | number,
  destItemsByListId: ReadonlyMap<string, ShoppingItem[]>,
  overData: Record<string, unknown> | undefined,
): { destListId: string; toIndex: number | undefined } | null {
  const overIdStr = String(overId)

  if (overIdStr.startsWith(LIST_HEADER_DROPPABLE_PREFIX)) {
    return {
      destListId: overIdStr.slice(LIST_HEADER_DROPPABLE_PREFIX.length),
      toIndex: undefined,
    }
  }
  if (overIdStr.startsWith(LIST_BODY_DROPPABLE_PREFIX)) {
    return {
      destListId: overIdStr.slice(LIST_BODY_DROPPABLE_PREFIX.length),
      toIndex: undefined,
    }
  }

  // Otherwise `over` is an item row -- its sortableData carries the list it
  // belongs to (see ActiveItemRow's sortableData prop / AllListsSection).
  const destListId = overData?.listId
  if (typeof destListId !== 'string') {
    return null
  }
  const destItems = destItemsByListId.get(destListId) ?? []
  const index = destItems.findIndex((item) => item.id === overIdStr)
  return { destListId, toIndex: index === -1 ? undefined : index }
}

export type DragEndPlan =
  | { type: 'none' }
  | { type: 'reorder'; listId: string; itemId: string; newOrder: number }
  | {
      type: 'move'
      sourceListId: string
      destListId: string
      item: ShoppingItem
      newOrder: number
    }

export interface DragEndInput {
  activeId: string | number
  activeListId: unknown
  over: {
    id: string | number
    data: Record<string, unknown> | undefined
  } | null
  activeItemsByListId: ReadonlyMap<string, ShoppingItem[]>
}

// Decides what write (if any) a finished drag should produce -- pure, so the
// reorder-vs-move branching and fractional-order math are unit-testable
// without dnd-kit or Firestore.
export function planDragEnd({
  activeId,
  activeListId,
  over,
  activeItemsByListId,
}: DragEndInput): DragEndPlan {
  if (!over || activeId === over.id) {
    return { type: 'none' }
  }
  if (typeof activeListId !== 'string') {
    return { type: 'none' }
  }
  const sourceListId = activeListId
  const sourceItems = activeItemsByListId.get(sourceListId) ?? []
  const draggedItem = sourceItems.find((item) => item.id === activeId)
  if (!draggedItem) {
    // The item vanished from this section between the drag starting and
    // ending (e.g. it was checked off or deleted by another Member
    // mid-drag) -- nothing sane to write.
    return { type: 'none' }
  }

  const drop = resolveDrop(over.id, activeItemsByListId, over.data)
  if (!drop) {
    return { type: 'none' }
  }
  const { destListId, toIndex } = drop

  if (destListId === sourceListId) {
    const fromIndex = sourceItems.findIndex((item) => item.id === activeId)
    const resolvedToIndex = toIndex ?? sourceItems.length - 1
    if (fromIndex === resolvedToIndex) {
      return { type: 'none' }
    }
    return {
      type: 'reorder',
      listId: sourceListId,
      itemId: String(activeId),
      newOrder: reorderActiveItems(sourceItems, fromIndex, resolvedToIndex),
    }
  }

  const destItems = activeItemsByListId.get(destListId) ?? []
  const resolvedToIndex = toIndex ?? destItems.length
  return {
    type: 'move',
    sourceListId,
    destListId,
    item: draggedItem,
    newOrder: insertActiveOrder(destItems, resolvedToIndex),
  }
}

// Error texts/codes for the screen's failure paths, kept next to
// moveConflictMessage so all of this screen's user-facing copy lives in one
// place.
export const REORDER_FAILED_MESSAGE = 'Preusporiadanie sa nepodarilo.'
export const MOVE_FAILED_MESSAGE = 'Presun sa nepodarilo.'
export const CLEAR_DONE_FAILED_MESSAGE =
  'Vyčistenie sa nepodarilo pre niektoré zoznamy.'
// Code AddItemForm understands for "the add failed" (shared with the
// single-list flow's useAddItemSubmit).
export const ADD_ITEM_ERROR_UNKNOWN = 'unknown'
