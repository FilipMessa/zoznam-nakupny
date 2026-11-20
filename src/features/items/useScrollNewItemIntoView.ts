import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { latestNewActiveId } from './itemService'
import type { ShoppingItem } from './types'

export interface UseScrollNewItemIntoViewResult {
  mainRef: RefObject<HTMLElement | null>
  requestScrollAfterAdd: (listId: string) => void
}

interface PendingScroll {
  listId: string
  // The list's active ids when the request was made -- the first id that
  // shows up beyond these is the one the user just added.
  knownIds: string[]
}

// After the user adds an item to a list (or unchecks one back into it, which
// also appends to the bottom of its active items), scroll it into view so
// they can see it land -- but only on their own actions, gated by a pending
// request for that list, so a realtime add from another family member never
// yanks the local scroll position. The request is made synchronously at
// submit time rather than after awaiting the write, because with offline
// persistence the write promise doesn't resolve until reconnect while the
// local onSnapshot (and this effect) fires immediately.
export function useScrollNewItemIntoView(
  activeItemsByList: ReadonlyMap<string, ShoppingItem[]>,
): UseScrollNewItemIntoViewResult {
  const mainRef = useRef<HTMLElement>(null)
  // A ref, not state: making a request has nothing to render -- only the
  // next snapshot of that list (the effect below) acts on it.
  const pendingRef = useRef<PendingScroll | null>(null)

  useEffect(() => {
    const pending = pendingRef.current
    if (!pending) {
      return
    }
    const newId = latestNewActiveId(
      pending.knownIds,
      activeItemsByList.get(pending.listId) ?? [],
    )
    if (newId) {
      mainRef.current
        ?.querySelector(`[data-swipe-row="${newId}"]`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      pendingRef.current = null
    }
  }, [activeItemsByList])

  const requestScrollAfterAdd = useCallback(
    (listId: string) => {
      const known = activeItemsByList.get(listId) ?? []
      pendingRef.current = { listId, knownIds: known.map((item) => item.id) }
    },
    [activeItemsByList],
  )

  return { mainRef, requestScrollAfterAdd }
}
