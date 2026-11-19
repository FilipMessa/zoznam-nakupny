import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/render'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ListSwitcherOverlay } from './ListSwitcherOverlay'
import { ListContentPlaceholder } from './ListContentPlaceholder'
import type { ShoppingList } from '@/features/lists/types'

const lists: ShoppingList[] = [
  {
    id: 'list-a',
    name: 'Groceries',
    createdAt: null as never,
    createdBy: 'u1',
  },
  { id: 'list-b', name: 'Hardware', createdAt: null as never, createdBy: 'u1' },
]

// The switcher is an overlay/drawer, not a route: opening and closing it must
// never unmount the screen underneath. We prove that by rendering the
// underlying list content alongside the overlay and toggling `open`.
function Harness() {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <ListContentPlaceholder listName="Groceries" />
      <button type="button" onClick={() => setOpen((o) => !o)}>
        toggle overlay
      </button>
      <ListSwitcherOverlay
        open={open}
        lists={lists}
        selectedListId="list-a"
        onSelect={vi.fn()}
        onClose={() => setOpen(false)}
        onCreate={vi.fn()}
      />
    </div>
  )
}

describe('ListSwitcherOverlay', () => {
  it('renders list rows for each list when open', () => {
    render(
      <ListSwitcherOverlay
        open={true}
        lists={lists}
        selectedListId="list-a"
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onCreate={vi.fn()}
      />,
    )

    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.getByText('Hardware')).toBeInTheDocument()
  })

  it('renders nothing visible when closed', () => {
    render(
      <ListSwitcherOverlay
        open={false}
        lists={lists}
        selectedListId="list-a"
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onCreate={vi.fn()}
      />,
    )

    expect(screen.queryByText('Hardware')).not.toBeInTheDocument()
  })

  it('keeps the underlying list content mounted while the overlay opens and closes', async () => {
    const { unmount } = render(<Harness />)
    // The Chakra/Ark drawer applies a body-level pointer-events lock via a
    // microtask while modal; jsdom doesn't settle that timing reliably, so
    // the pointer-events hit-test check is disabled for this interaction.
    const user = userEvent.setup({ pointerEventsCheck: 0 })

    // Overlay starts open; underlying content must already be present.
    expect(
      screen.getByText(/items for groceries coming soon/i),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /toggle overlay/i }))
    // Overlay is now closed.
    expect(screen.queryByText('Hardware')).not.toBeInTheDocument()
    // The screen underneath was never unmounted.
    expect(
      screen.getByText(/items for groceries coming soon/i),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /toggle overlay/i }))
    expect(screen.getByText('Hardware')).toBeInTheDocument()
    expect(
      screen.getByText(/items for groceries coming soon/i),
    ).toBeInTheDocument()

    unmount()
  })

  // Phase 7 (Mobile UI Polish): the switcher becomes a bottom sheet with a
  // backdrop. It must keep its existing dialog semantics (role="dialog",
  // aria-modal="true") so screen readers still treat it as a modal, while
  // gaining a backdrop that closes it on click -- the common mobile pattern
  // for dismissing a sheet by tapping outside it.
  it('keeps dialog semantics for assistive tech', () => {
    render(
      <ListSwitcherOverlay
        open={true}
        lists={lists}
        selectedListId="list-a"
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onCreate={vi.fn()}
      />,
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('renders a backdrop element when open', () => {
    render(
      <ListSwitcherOverlay
        open={true}
        lists={lists}
        selectedListId="list-a"
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onCreate={vi.fn()}
      />,
    )

    expect(screen.getByTestId('list-switcher-backdrop')).toBeInTheDocument()
  })

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(
      <ListSwitcherOverlay
        open={true}
        lists={lists}
        selectedListId="list-a"
        onSelect={vi.fn()}
        onClose={onClose}
        onCreate={vi.fn()}
      />,
    )

    await user.click(screen.getByTestId('list-switcher-backdrop'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders a close button that calls onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <ListSwitcherOverlay
        open={true}
        lists={lists}
        selectedListId="list-a"
        onSelect={vi.fn()}
        onClose={onClose}
        onCreate={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /zatvoriť/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders a create-list button that calls onCreate', async () => {
    const onCreate = vi.fn()
    const user = userEvent.setup()
    render(
      <ListSwitcherOverlay
        open={true}
        lists={lists}
        selectedListId="list-a"
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onCreate={onCreate}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: /vytvoriť nový zoznam/i }),
    )

    expect(onCreate).toHaveBeenCalledTimes(1)
  })
})
