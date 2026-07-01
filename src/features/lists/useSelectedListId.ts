import { useCallback, useMemo, useState } from 'react'
import { SELECTED_LIST_STORAGE_KEY } from '../../constants/storage'
import type { ShoppingList } from './types'

export interface UseSelectedListIdResult {
  selectedListId: string | null
  selectList: (listId: string) => void
}

function readPersistedId(): string | null {
  try {
    return window.localStorage.getItem(SELECTED_LIST_STORAGE_KEY)
  } catch {
    return null
  }
}

function persistId(listId: string): void {
  try {
    window.localStorage.setItem(SELECTED_LIST_STORAGE_KEY, listId)
  } catch {
    // Ignore write failures (e.g. private-mode storage restrictions); the
    // selection still works for the current session via component state.
  }
}

export function useSelectedListId(
  lists: ShoppingList[],
): UseSelectedListIdResult {
  const [override, setOverride] = useState<string | null>(null)

  const fallbackId = lists.length > 0 ? lists[0].id : null

  const selectedListId = useMemo(() => {
    if (override && lists.some((list) => list.id === override)) {
      return override
    }

    const persisted = readPersistedId()
    if (persisted && lists.some((list) => list.id === persisted)) {
      return persisted
    }

    return fallbackId
  }, [override, lists, fallbackId])

  const selectList = useCallback((listId: string) => {
    setOverride(listId)
    persistId(listId)
  }, [])

  return { selectedListId, selectList }
}
