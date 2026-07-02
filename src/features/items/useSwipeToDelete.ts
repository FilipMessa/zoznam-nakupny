import { useRef, useState, type MouseEvent, type PointerEvent } from 'react'

export const swipeActionWidth = 84
const swipeOpenThreshold = 36

function clampSwipeOffset(value: number) {
  return Math.min(0, Math.max(-swipeActionWidth, value))
}

// Uses Pointer Events (onPointerDown/Move/Up/Cancel) rather than Touch
// Events on purpose: @dnd-kit's TouchSensor activates via `onTouchStart`
// and MouseSensor via `onMouseDown`, so these handlers never collide with
// dnd-kit's own listeners when spread onto the same element. Direction is
// still resolved from an 8px dead zone (matching dnd-kit's own
// `tolerance: 8` touch activation constraint) so a fast horizontal swipe
// naturally cancels dnd-kit's pending long-press drag before it starts.
export function useSwipeToDelete() {
  const [swipeOffset, setSwipeOffsetState] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const swipeOffsetRef = useRef(0)
  const touchStartRef = useRef<{
    x: number
    y: number
    startOffset: number
    swiping: boolean
  } | null>(null)

  const setSwipeOffset = (value: number) => {
    const clampedValue = clampSwipeOffset(value)
    swipeOffsetRef.current = clampedValue
    setSwipeOffsetState(clampedValue)
  }

  const closeSwipeAction = () => setSwipeOffset(0)

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'touch') {
      return
    }

    touchStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      startOffset: swipeOffsetRef.current,
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
      setIsSwiping(true)
      event.currentTarget.setPointerCapture?.(event.pointerId)
    }

    event.preventDefault()
    setSwipeOffset(touchStart.startOffset + deltaX)
  }

  const finishSwipe = () => {
    const touchStart = touchStartRef.current
    if (!touchStart) {
      return
    }

    const shouldOpen =
      touchStart.swiping && swipeOffsetRef.current <= -swipeOpenThreshold
    setIsSwiping(false)
    setSwipeOffset(shouldOpen ? -swipeActionWidth : 0)
    touchStartRef.current = null
  }

  const handleForegroundClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (swipeOffsetRef.current === 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    closeSwipeAction()
  }

  return {
    swipeOffset,
    isSwiping,
    closeSwipeAction,
    swipeHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: finishSwipe,
      onPointerCancel: finishSwipe,
    },
    onForegroundClickCapture: handleForegroundClickCapture,
  }
}
