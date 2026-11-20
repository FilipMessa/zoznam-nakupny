import { useRef, useState, type MouseEvent, type PointerEvent } from 'react'

const swipeOpenThreshold = 36

function clampSwipeOffset(actionsWidth: number, value: number) {
  return Math.min(0, Math.max(-actionsWidth, value))
}

export interface UseSwipeActionsParams {
  // Total width of the revealed action button(s) -- DoneItemRow has a
  // single action, ActiveItemRow two stacked ones (Upraviť + Zmazať).
  actionsWidth: number
  // Whether the row is open, owned by the parent list (useSwipeRowRegistry)
  // -- the only "open" state there is. This hook only tracks a swipe that's
  // in flight and reports where it ended via onOpenChange.
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

// Uses Pointer Events (onPointerDown/Move/Up/Cancel) rather than Touch
// Events on purpose: @dnd-kit's TouchSensor activates via `onTouchStart`
// and MouseSensor via `onMouseDown`, so these handlers never collide with
// dnd-kit's own listeners when spread onto the same element. Direction is
// still resolved from an 8px dead zone (matching dnd-kit's own
// `tolerance: 8` touch activation constraint) so a fast horizontal swipe
// naturally cancels dnd-kit's pending long-press drag before it starts.
export function useSwipeActions({
  actionsWidth,
  isOpen,
  onOpenChange,
}: UseSwipeActionsParams) {
  // The foreground's offset while a swipe is in flight; null otherwise, when
  // the row rests where the parent's open state puts it.
  const [dragOffset, setDragOffset] = useState<number | null>(null)
  const swipeOffset = dragOffset ?? (isOpen ? -actionsWidth : 0)
  const touchStartRef = useRef<{
    x: number
    y: number
    startOffset: number
    offset: number
    swiping: boolean
  } | null>(null)
  // Set when a touch gesture ends as a swipe, or as a tap that closed an open
  // row, so the click the browser may still send for it doesn't reach the
  // row (where a tap toggles the item). Reset on every pointerdown, so a
  // gesture that never produced a click can't swallow the next tap's.
  const suppressClickRef = useRef(false)

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    suppressClickRef.current = false
    if (event.pointerType !== 'touch') {
      return
    }

    touchStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      startOffset: swipeOffset,
      offset: swipeOffset,
      swiping: false,
    }
  }

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const touchStart = touchStartRef.current
    if (!touchStart || event.pointerType !== 'touch') {
      return
    }

    const deltaX = event.clientX - touchStart.x
    const deltaY = event.clientY - touchStart.y
    const absoluteDeltaX = Math.abs(deltaX)
    const absoluteDeltaY = Math.abs(deltaY)

    if (!touchStart.swiping) {
      if (absoluteDeltaX < 8 && absoluteDeltaY < 8) {
        return
      }

      if (absoluteDeltaY > absoluteDeltaX) {
        touchStartRef.current = null
        return
      }

      touchStart.swiping = true
      try {
        event.currentTarget.setPointerCapture?.(event.pointerId)
      } catch (error) {
        console.debug('setPointerCapture failed', error)
      }
    }

    event.preventDefault()
    touchStart.offset = clampSwipeOffset(
      actionsWidth,
      touchStart.startOffset + deltaX,
    )
    setDragOffset(touchStart.offset)
  }

  // A swipe snaps open past the threshold and shut otherwise; a tap that
  // never started swiping closes an open row too.
  const finishSwipe = () => {
    const touchStart = touchStartRef.current
    if (!touchStart) {
      return
    }

    touchStartRef.current = null
    suppressClickRef.current =
      touchStart.swiping || touchStart.startOffset !== 0
    const shouldOpen =
      touchStart.swiping && touchStart.offset <= -swipeOpenThreshold
    setDragOffset(null)
    if (shouldOpen !== isOpen) {
      onOpenChange(shouldOpen)
    }
  }

  // A click on an open row's foreground (e.g. a mouse click on a row opened
  // by touch) only closes it; the click ending a swipe, or a touch tap that
  // already closed the row on pointerup, does nothing.
  const handleForegroundClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      event.preventDefault()
      event.stopPropagation()
      return
    }

    if (swipeOffset === 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    onOpenChange(false)
  }

  return {
    swipeOffset,
    isSwiping: dragOffset !== null,
    swipeHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: finishSwipe,
      onPointerCancel: finishSwipe,
    },
    onForegroundClickCapture: handleForegroundClickCapture,
  }
}
