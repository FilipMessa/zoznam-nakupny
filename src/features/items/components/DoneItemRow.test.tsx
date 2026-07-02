import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { DoneItemRow, type DoneItemRowProps } from './DoneItemRow'
import type { ShoppingItem } from '../types'

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
    isSwipeOpen: true,
    onSwipeOpenChange: vi.fn(),
    ...overrides,
  }
}

describe('DoneItemRow', () => {
  it('renders the item text', () => {
    render(<DoneItemRow {...makeProps({ item: makeDoneItem({ text: 'mlieko' }) })} />)

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

    expect(onUncheck).toHaveBeenCalledWith('item-7')
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

  it('shows a pending-sync icon when the item has not synced yet', () => {
    render(<DoneItemRow {...makeProps({ item: makeDoneItem({ pendingSync: true }) })} />)

    expect(screen.getByTitle('Čaká na odoslanie')).toBeInTheDocument()
  })

  it('does not show a pending-sync icon once the item has synced', () => {
    render(<DoneItemRow {...makeProps({ item: makeDoneItem({ pendingSync: false }) })} />)

    expect(screen.queryByTitle('Čaká na odoslanie')).not.toBeInTheDocument()
  })

  it('snaps an open swipe closed when it loses exclusive open status', () => {
    const { container, rerender } = render(
      <DoneItemRow {...makeProps({ item: makeDoneItem({ id: 'item-9' }) })} />,
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
        {...makeProps({ item: makeDoneItem({ id: 'item-9' }), isSwipeOpen: false })}
      />,
    )

    expect(
      container.querySelector('button[aria-label="Vymazať položku"]'),
    ).toHaveAttribute('aria-hidden', 'true')
  })
})
