import type { MoveItemResult, ShoppingItem } from '@/features/items/types'
import type { ShoppingList } from './types'

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
