import { useEffect, useState } from 'react'

export interface UseSwipeRowRegistryResult {
  openSwipeItemId: string | null
  handleSwipeOpenChange: (itemId: string, open: boolean) => void
  handleListScroll: () => void
}

// Native-app swipe-action pattern: an open swipe (Upraviť/Zmazať reveal)
// closes on any interaction outside the row it belongs to -- tapping
// another row, the add-item bar, or anywhere else on the page.
// Opening a *different* row's swipe already forces this one closed via
// each row's own "isSwipeOpen" prop; this listener covers everything
// that isn't a row at all.
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

  const handleSwipeOpenChange = (itemId: string, open: boolean) => {
    setOpenSwipeItemId(open ? itemId : null)
  }

  const handleListScroll = () => {
    if (openSwipeItemId) {
      setOpenSwipeItemId(null)
    }
  }

  return { openSwipeItemId, handleSwipeOpenChange, handleListScroll }
}
