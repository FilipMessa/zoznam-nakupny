import { useCallback, useEffect, useState } from 'react'

export interface UseSwipeRowRegistryResult {
  openSwipeItemId: string | null
  handleSwipeOpenChange: (itemId: string, open: boolean) => void
  handleListScroll: () => void
}

// Which row's swipe actions (Upraviť/Zmazať reveal) are open -- the single
// source of truth rows render from, so opening one row closes any other.
// Native-app pattern: an open swipe also closes on any interaction outside
// its row -- tapping another row, the add-item bar, or anywhere else on the
// page (the listener below).
export function useSwipeRowRegistry(): UseSwipeRowRegistryResult {
  const [openSwipeItemId, setOpenSwipeItemId] = useState<string | null>(null)

  useEffect(() => {
    if (!openSwipeItemId) {
      return
    }

    const handlePointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target as HTMLElement
      const row = target.closest('[data-swipe-row]')
      if (row?.getAttribute('data-swipe-row') !== openSwipeItemId) {
        setOpenSwipeItemId(null)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    return () =>
      document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [openSwipeItemId])

  // Stable, so lists can hand it straight to memoized rows.
  const handleSwipeOpenChange = useCallback((itemId: string, open: boolean) => {
    setOpenSwipeItemId(open ? itemId : null)
  }, [])

  const handleListScroll = () => {
    if (openSwipeItemId) {
      setOpenSwipeItemId(null)
    }
  }

  return { openSwipeItemId, handleSwipeOpenChange, handleListScroll }
}
