import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { sortItems, latestNewActiveId } from './itemService'
import type { ShoppingItem } from './types'

export interface UseScrollNewItemIntoViewResult {
  mainRef: RefObject<HTMLElement | null>
  requestScrollAfterAdd: () => void
}

// After the user adds an item (which always appends to the bottom of the
// active section), scroll it into view so they can see it land -- but only
// on their own adds, gated by `scrollAfterAdd`, so a realtime add from
// another family member never yanks the local scroll position. The flag is
// set synchronously at submit time rather than after awaiting the write,
// because with offline persistence the write promise doesn't resolve until
// reconnect while the local onSnapshot (and this effect) fires immediately.
export function useScrollNewItemIntoView(
  items: ShoppingItem[],
  containerRef?: RefObject<HTMLElement | null>,
): UseScrollNewItemIntoViewResult {
  const ownRef = useRef<HTMLElement>(null)
  const mainRef = containerRef ?? ownRef
  const prevActiveIdsRef = useRef<string[]>([])
  const [scrollAfterAdd, setScrollAfterAdd] = useState(false)

  useEffect(() => {
    const active = sortItems(items).active
    const newId = latestNewActiveId(prevActiveIdsRef.current, active)
    prevActiveIdsRef.current = active.map((item) => item.id)

    if (scrollAfterAdd && newId) {
      mainRef.current
        ?.querySelector(`[data-swipe-row="${newId}"]`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      setScrollAfterAdd(false)
    }
  }, [items, scrollAfterAdd, mainRef])

  const requestScrollAfterAdd = useCallback(() => {
    setScrollAfterAdd(true)
  }, [])

  return { mainRef, requestScrollAfterAdd }
}
