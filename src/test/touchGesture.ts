import { fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

// A one-finger touch gesture on a swipe row's foreground: pointerdown at
// (200, 100), a pointermove to each x in `moveXs`, pointerup at the last
// one. `[]` is a tap; a move past the 8px dead zone starts a swipe, and one
// past 36px to the left swipes the row open.
export function touchGesture(element: HTMLElement, moveXs: number[]) {
  element.setPointerCapture = vi.fn()
  fireEvent.pointerDown(element, {
    pointerType: 'touch',
    clientX: 200,
    clientY: 100,
  })
  for (const clientX of moveXs) {
    fireEvent.pointerMove(element, {
      pointerType: 'touch',
      clientX,
      clientY: 101,
    })
  }
  fireEvent.pointerUp(element, {
    pointerType: 'touch',
    clientX: moveXs.at(-1) ?? 200,
    clientY: 101,
  })
}
