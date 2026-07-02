import { useEffect } from 'react'
import { useSwipeActions } from './useSwipeActions'

export interface UseRowSwipeSyncParams {
  actionsWidth: number
  isSwipeOpen: boolean
  onSwipeOpenChange: (open: boolean) => void
  forceClosed?: boolean
}

// Wraps useSwipeActions with the row <-> parent open-state synchronization
// shared by ActiveItemRow and DoneItemRow: report to the parent when this
// row's gesture opens it, snap shut when the parent revokes the row's
// exclusive "open" status, and optionally force-close (e.g. while editing).
export function useRowSwipeSync({
  actionsWidth,
  isSwipeOpen,
  onSwipeOpenChange,
  forceClosed = false,
}: UseRowSwipeSyncParams): ReturnType<typeof useSwipeActions> {
  const swipeActions = useSwipeActions(actionsWidth)
  const { swipeOffset, closeSwipeAction } = swipeActions

  // Tell the parent this row just became the open one.
  useEffect(() => {
    if (swipeOffset !== 0) {
      onSwipeOpenChange(true)
    }
  }, [swipeOffset, onSwipeOpenChange])

  // A row that lost exclusive "open" status (another row opened, or a tap
  // landed outside every row) snaps itself shut. This must key off
  // `isSwipeOpen` actually *changing*, not run on every render: right after
  // this row's own gesture opens it, `isSwipeOpen` is still false for one
  // render (the parent only learns about it via the effect above, on the
  // next tick), so a synchronous "close if swipeOffset !== 0 && !isSwipeOpen"
  // check on every render would immediately re-close a swipe the instant it
  // opens.
  useEffect(() => {
    if (!isSwipeOpen) {
      closeSwipeAction()
    }
  }, [isSwipeOpen, closeSwipeAction])

  // Entering a forced-closed state (ActiveItemRow passes `isEditing`: the
  // edit form doesn't apply the swipe transform, so there's nothing for an
  // open offset to visually mean while editing) always resets the swipe to
  // closed.
  useEffect(() => {
    if (forceClosed) {
      closeSwipeAction()
    }
  }, [forceClosed, closeSwipeAction])

  return swipeActions
}
