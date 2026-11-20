import type { MouseEvent } from 'react'

// Controls inside a row that handle their own clicks. The checkbox is a
// <label> wrapping a hidden <input>, so one tap on it yields two clicks (the
// label's, then the input's forwarded one) on top of its own
// onCheckedChange -- all of them have to be left alone.
const ownClickSelector = 'button, input, label, a'

// A tap anywhere on a row's foreground (text, grip, empty space) runs
// `onTap`, so the most frequent action needn't hit the small checkbox. A
// pointer convenience only: the checkbox stays the accessible control, and
// no role or tab stop is added here.
//
// Taps that end a gesture never get here: useSwipeActions' click capture
// swallows the click after a swipe or after a tap that closes an open row,
// and dnd-kit stops click propagation at the document once a drag has
// activated.
export function useRowTap(onTap: () => void) {
  return (event: MouseEvent<HTMLElement>) => {
    if (!(event.target instanceof Element)) {
      return
    }
    const control = event.target.closest(ownClickSelector)
    if (control && event.currentTarget.contains(control)) {
      return
    }
    onTap()
  }
}
