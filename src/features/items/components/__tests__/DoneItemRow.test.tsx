import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@/test/render'
import userEvent from '@testing-library/user-event'
import {
  DoneItemRow as ControlledDoneItemRow,
  type DoneItemRowProps,
} from '@/features/items/components/DoneItemRow'
import { withSwipeParent } from '@/test/withSwipeParent'
import { touchGesture } from '@/test/touchGesture'
import type { ShoppingItem } from '@/features/items/types'

// Rendered under a parent that owns the open state, as in the app.
const DoneItemRow = withSwipeParent(ControlledDoneItemRow)

function makeDoneItem(overrides: Partial<ShoppingItem> = {}): ShoppingItem {
  return {
    id: 'item-1',
    text: 'mlieko',
    status: 'done',
    activeOrder: null,
    completedAt: null as unknown as ShoppingItem['completedAt'],
    completedBy: 'uid-1',
    createdAt: null as unknown as ShoppingItem['createdAt'],
    createdBy: 'uid-1',
    updatedAt: null as unknown as ShoppingItem['updatedAt'],
    ...overrides,
  }
}

function makeProps(
  overrides: Partial<DoneItemRowProps> = {},
): DoneItemRowProps {
  return {
    item: makeDoneItem(),
    onUncheck: vi.fn(),
    onDelete: vi.fn(),
    // Matches the real app's initial state -- see ActiveItemRow.test.tsx's
    // makeProps.
    isSwipeOpen: false,
    onSwipeOpenChange: vi.fn(),
    ...overrides,
  }
}

describe('DoneItemRow', () => {
  it('renders the item text', () => {
    render(
      <DoneItemRow
        {...makeProps({ item: makeDoneItem({ text: 'mlieko' }) })}
      />,
    )

    expect(screen.getByText('mlieko')).toBeInTheDocument()
  })

  it('renders a checked checkbox', () => {
    render(<DoneItemRow {...makeProps()} />)

    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('calls onUncheck with the item id when the checkbox is clicked', async () => {
    const onUncheck = vi.fn()
    const user = userEvent.setup()
    render(
      <DoneItemRow
        {...makeProps({ item: makeDoneItem({ id: 'item-7' }), onUncheck })}
      />,
    )

    await user.click(screen.getByRole('checkbox'))

    expect(onUncheck).toHaveBeenCalledTimes(1)
    expect(onUncheck).toHaveBeenCalledWith('item-7')
  })

  it('calls onUncheck exactly once when the visible checkbox control is tapped', async () => {
    const onUncheck = vi.fn()
    const user = userEvent.setup()
    const { container } = render(<DoneItemRow {...makeProps({ onUncheck })} />)

    await user.click(
      container.querySelector<HTMLElement>('[data-part="control"]')!,
    )

    expect(onUncheck).toHaveBeenCalledTimes(1)
  })

  it('calls onUncheck with the item id when the item text is tapped', async () => {
    const onUncheck = vi.fn()
    const user = userEvent.setup()
    render(
      <DoneItemRow
        {...makeProps({
          item: makeDoneItem({ id: 'item-7', text: 'mlieko' }),
          onUncheck,
        })}
      />,
    )

    await user.click(screen.getByText('mlieko'))

    expect(onUncheck).toHaveBeenCalledTimes(1)
    expect(onUncheck).toHaveBeenCalledWith('item-7')
  })

  it('does not uncheck the item on the click that ends a swipe', () => {
    const onUncheck = vi.fn()
    render(<DoneItemRow {...makeProps({ onUncheck })} />)

    touchGesture(screen.getByTestId('done-item-content-item-1'), [120])
    fireEvent.click(screen.getByText('mlieko'))

    expect(onUncheck).not.toHaveBeenCalled()
  })

  it('ignores the second click of a double tap', () => {
    const onUncheck = vi.fn()
    render(<DoneItemRow {...makeProps({ onUncheck })} />)

    fireEvent.click(screen.getByText('mlieko'), { detail: 2 })

    expect(onUncheck).not.toHaveBeenCalled()
  })

  it('only closes an open row on a tap, without unchecking the item', () => {
    const onUncheck = vi.fn()
    const onSwipeOpenChange = vi.fn()
    render(
      <DoneItemRow
        {...makeProps({ isSwipeOpen: true, onUncheck, onSwipeOpenChange })}
      />,
    )

    touchGesture(screen.getByTestId('done-item-content-item-1'), [])
    fireEvent.click(screen.getByText('mlieko'))

    expect(onSwipeOpenChange).toHaveBeenCalledWith('item-1', false)
    expect(onUncheck).not.toHaveBeenCalled()
  })

  it('does not uncheck the item when a delete button is clicked', async () => {
    const onUncheck = vi.fn()
    const user = userEvent.setup()
    const { container } = render(
      <DoneItemRow {...makeProps({ isSwipeOpen: true, onUncheck })} />,
    )

    await user.click(
      container.querySelector<HTMLButtonElement>(
        'button[aria-label="Vymazať položku"]',
      )!,
    )
    await user.click(
      container.querySelector<HTMLButtonElement>(
        'button[aria-label="Zmazať"]',
      )!,
    )

    expect(onUncheck).not.toHaveBeenCalled()
  })

  it('does not expose a persistent delete button by default', () => {
    render(<DoneItemRow {...makeProps()} />)

    expect(
      screen.queryByRole('button', { name: /vymazať položku/i }),
    ).not.toBeInTheDocument()
  })

  it('calls onDelete with the item id when the swiped delete action is clicked', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()
    render(
      <DoneItemRow
        {...makeProps({ item: makeDoneItem({ id: 'item-9' }), onDelete })}
      />,
    )

    const rowContent = screen.getByTestId('done-item-content-item-9')
    fireEvent.pointerDown(rowContent, {
      pointerType: 'touch',
      pointerId: 1,
      clientX: 160,
      clientY: 20,
    })
    fireEvent.pointerMove(rowContent, {
      pointerType: 'touch',
      pointerId: 1,
      clientX: 80,
      clientY: 24,
    })
    fireEvent.pointerUp(rowContent, {
      pointerType: 'touch',
      pointerId: 1,
      clientX: 80,
      clientY: 24,
    })

    await user.click(screen.getByRole('button', { name: /vymazať položku/i }))

    expect(onDelete).toHaveBeenCalledWith('item-9')
  })

  it('does not render an origin dot by default', () => {
    render(<DoneItemRow {...makeProps()} />)

    expect(screen.queryByTestId('done-item-origin-dot')).not.toBeInTheDocument()
  })

  it('renders an origin color dot when originColor is passed', () => {
    render(<DoneItemRow {...makeProps({ originColor: 'blue.solid' })} />)

    expect(screen.getByTestId('done-item-origin-dot')).toBeInTheDocument()
  })

  it('shows a pending-sync icon when the item has not synced yet', () => {
    render(
      <DoneItemRow
        {...makeProps({ item: makeDoneItem({ pendingSync: true }) })}
      />,
    )

    expect(screen.getByTitle('Čaká na odoslanie')).toBeInTheDocument()
  })

  it('does not show a pending-sync icon once the item has synced', () => {
    render(
      <DoneItemRow
        {...makeProps({ item: makeDoneItem({ pendingSync: false }) })}
      />,
    )

    expect(screen.queryByTitle('Čaká na odoslanie')).not.toBeInTheDocument()
  })

  it('opens on its own gesture before the parent has confirmed it as the exclusive open row', () => {
    // Regression test -- see the equivalent ActiveItemRow.test.tsx case for
    // the full explanation.
    const { container } = render(
      <DoneItemRow
        {...makeProps({
          item: makeDoneItem({ id: 'item-9' }),
          isSwipeOpen: false,
        })}
      />,
    )

    const rowContent = screen.getByTestId('done-item-content-item-9')
    fireEvent.pointerDown(rowContent, {
      pointerType: 'touch',
      pointerId: 1,
      clientX: 160,
      clientY: 20,
    })
    fireEvent.pointerMove(rowContent, {
      pointerType: 'touch',
      pointerId: 1,
      clientX: 80,
      clientY: 24,
    })
    fireEvent.pointerUp(rowContent, {
      pointerType: 'touch',
      pointerId: 1,
      clientX: 80,
      clientY: 24,
    })

    expect(
      container.querySelector('button[aria-label="Vymazať položku"]'),
    ).toHaveAttribute('aria-hidden', 'false')
  })

  it('snaps an open swipe closed when it loses exclusive open status', () => {
    const { container, rerender } = render(
      <DoneItemRow
        {...makeProps({
          item: makeDoneItem({ id: 'item-9' }),
          isSwipeOpen: true,
        })}
      />,
    )

    const rowContent = screen.getByTestId('done-item-content-item-9')
    fireEvent.pointerDown(rowContent, {
      pointerType: 'touch',
      pointerId: 1,
      clientX: 160,
      clientY: 20,
    })
    fireEvent.pointerMove(rowContent, {
      pointerType: 'touch',
      pointerId: 1,
      clientX: 80,
      clientY: 24,
    })
    fireEvent.pointerUp(rowContent, {
      pointerType: 'touch',
      pointerId: 1,
      clientX: 80,
      clientY: 24,
    })

    expect(
      container.querySelector('button[aria-label="Vymazať položku"]'),
    ).toHaveAttribute('aria-hidden', 'false')

    rerender(
      <DoneItemRow
        {...makeProps({
          item: makeDoneItem({ id: 'item-9' }),
          isSwipeOpen: false,
        })}
      />,
    )

    expect(
      container.querySelector('button[aria-label="Vymazať položku"]'),
    ).toHaveAttribute('aria-hidden', 'true')
  })
})
