import {
  useCallback,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from 'react'

const swipeOpenThreshold = 36

function clampSwipeOffset(actionsWidth: number, value: number) {
  return Math.min(0, Math.max(-actionsWidth, value))
}

// Uses Pointer Events (onPointerDown/Move/Up/Cancel) rather than Touch
// Events on purpose: @dnd-kit's TouchSensor activates via `onTouchStart`
// and MouseSensor via `onMouseDown`, so these handlers never collide with
// dnd-kit's own listeners when spread onto the same element. Direction is
// still resolved from an 8px dead zone (matching dnd-kit's own
// `tolerance: 8` touch activation constraint) so a fast horizontal swipe
// naturally cancels dnd-kit's pending long-press drag before it starts.
//
// `actionsWidth` is the total width of the revealed action button(s) --
// callers with a single action (DoneItemRow) and callers with two stacked
// actions (ActiveItemRow's Upraviť + Zmazať) pass their own total.
export function useSwipeActions(actionsWidth: number) {
  const [swipeOffset, setSwipeOffsetState] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const swipeOffsetRef = useRef(0)
  const touchStartRef = useRef<{
    x: number
    y: number
    startOffset: number
    swiping: boolean
  } | null>(null)

  // Stable across renders (only actionsWidth as a dependency, which is
  // effectively constant per call site) so callers can safely depend on
  // `closeSwipeAction`'s identity in their own effects.
  const setSwipeOffset = useCallback(
    (value: number) => {
      const clampedValue = clampSwipeOffset(actionsWidth, value)
      swipeOffsetRef.current = clampedValue
      setSwipeOffsetState(clampedValue)
    },
    [actionsWidth],
  )

  const closeSwipeAction = useCallback(
    () => setSwipeOffset(0),
    [setSwipeOffset],
  )

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
      try {
        event.currentTarget.setPointerCapture?.(event.pointerId)
      } catch (error) {
        console.debug('setPointerCapture failed', error)
      }
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
    setSwipeOffset(shouldOpen ? -actionsWidth : 0)
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
