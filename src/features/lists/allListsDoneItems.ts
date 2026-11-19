import type { ShoppingItem } from '@/features/items/types'
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
