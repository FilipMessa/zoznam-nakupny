import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '../../../test/render'
import { SyncStatusBanner } from './SyncStatusBanner'

describe('SyncStatusBanner', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when there is nothing pending', () => {
    render(<SyncStatusBanner pendingCount={0} />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows a singular message for one pending item', () => {
    render(<SyncStatusBanner pendingCount={1} />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Synchronizujem 1 položku…',
    )
  })

  it('shows a plural message with the count for several pending items', () => {
    render(<SyncStatusBanner pendingCount={3} />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Synchronizujem 3 položiek…',
    )
  })

  it('shows a brief "synced" message after pending count drops to zero, then hides it', () => {
    vi.useFakeTimers()
    const { rerender } = render(<SyncStatusBanner pendingCount={2} />)

    rerender(<SyncStatusBanner pendingCount={0} />)

    // The drop to zero is debounced briefly to smooth out transient
    // reconnect churn, so it doesn't flip to "synced" immediately.
    act(() => {
      vi.advanceTimersByTime(800)
    })

    expect(screen.getByRole('status')).toHaveTextContent('Zosynchronizované')

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('keeps showing "Synchronizujem" through a brief flicker back to zero, instead of jittering', () => {
    // Regression test: while genuinely offline, Firestore retries its
    // Listen/Write streams and can flip hasPendingWrites false/true a few
    // times a second. Without debouncing the drop to zero, this banner
    // (and the item list below it) would flicker in and out of the page,
    // which was observed to make nearby tap targets miss in e2e runs.
    vi.useFakeTimers()
    const { rerender } = render(<SyncStatusBanner pendingCount={1} />)

    rerender(<SyncStatusBanner pendingCount={0} />)
    act(() => {
      vi.advanceTimersByTime(400)
    })
    rerender(<SyncStatusBanner pendingCount={1} />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Synchronizujem 1 položku…',
    )
  })
})
