import { useCallback } from 'react'
import { purchaseSuggestions } from './itemService'
import { usePurchaseMemory } from './usePurchaseMemory'
import type { PurchaseMemoryEntry, ShoppingItem } from './types'

const NO_SUGGESTIONS: PurchaseMemoryEntry[] = []

// Add-item suggestions for List `listId` (the single-list screen's List, or
// the All Lists screen's Add Target; null = nowhere to add, no
// suggestions), read from the Purchase Memory. Returns a function of the
// typed text so the add-item form, which owns that text, re-renders alone
// on each keystroke rather than the whole screen.
export function usePurchaseSuggestions(
  listId: string | null,
  activeItems: readonly ShoppingItem[],
): (text: string) => PurchaseMemoryEntry[] {
  const entries = usePurchaseMemory()

  return useCallback(
    (text: string) =>
      listId === null
        ? NO_SUGGESTIONS
        : purchaseSuggestions(entries, text, listId, activeItems),
    [entries, listId, activeItems],
  )
}
