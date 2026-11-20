import { useState, type ComponentType } from 'react'

interface SwipeRowProps {
  isSwipeOpen: boolean
  onSwipeOpenChange: (id: string, open: boolean) => void
}

// Swipe rows are controlled: whether one is open lives in the parent list
// (useSwipeRowRegistry), and a row only reports where a gesture ended. This
// wraps a row in a minimal parent that applies those reports, so row tests
// can swipe it open as in the app. `isSwipeOpen` seeds that state and
// re-seeds it whenever a test re-renders with a different value (the parent
// granting or revoking the row's open status); `onSwipeOpenChange` is still
// called, so tests can assert on it.
export function withSwipeParent<P extends SwipeRowProps>(
  Row: ComponentType<P>,
) {
  return function SwipeParent(props: P) {
    const [open, setOpen] = useState(props.isSwipeOpen)
    const [seed, setSeed] = useState(props.isSwipeOpen)
    if (props.isSwipeOpen !== seed) {
      setSeed(props.isSwipeOpen)
      setOpen(props.isSwipeOpen)
    }

    return (
      <Row
        {...props}
        isSwipeOpen={open}
        onSwipeOpenChange={(id: string, nextOpen: boolean) => {
          setOpen(nextOpen)
          props.onSwipeOpenChange(id, nextOpen)
        }}
      />
    )
  }
}
