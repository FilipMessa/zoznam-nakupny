import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { DoneItemRow } from './DoneItemRow'
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

describe('DoneItemRow', () => {
  it('renders the item text', () => {
    render(
      <DoneItemRow
        item={makeDoneItem({ text: 'mlieko' })}
        onUncheck={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.getByText('mlieko')).toBeInTheDocument()
  })

  it('renders a checked checkbox', () => {
    render(
      <DoneItemRow item={makeDoneItem()} onUncheck={vi.fn()} onDelete={vi.fn()} />,
    )

    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('calls onUncheck with the item id when the checkbox is clicked', async () => {
    const onUncheck = vi.fn()
    const user = userEvent.setup()
    render(
      <DoneItemRow
        item={makeDoneItem({ id: 'item-7' })}
        onUncheck={onUncheck}
        onDelete={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('checkbox'))

    expect(onUncheck).toHaveBeenCalledWith('item-7')
  })

  it('does not expose a persistent delete button by default', () => {
    render(
      <DoneItemRow item={makeDoneItem()} onUncheck={vi.fn()} onDelete={vi.fn()} />,
    )

    expect(
      screen.queryByRole('button', { name: /vymazať položku/i }),
    ).not.toBeInTheDocument()
  })

  it('calls onDelete with the item id when the swiped delete action is clicked', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()
    render(
      <DoneItemRow
        item={makeDoneItem({ id: 'item-9' })}
        onUncheck={vi.fn()}
        onDelete={onDelete}
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
    render(
      <DoneItemRow
        item={makeDoneItem({ pendingSync: true })}
        onUncheck={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.getByTitle('Čaká na odoslanie')).toBeInTheDocument()
  })

  it('does not show a pending-sync icon once the item has synced', () => {
    render(
      <DoneItemRow
        item={makeDoneItem({ pendingSync: false })}
        onUncheck={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.queryByTitle('Čaká na odoslanie')).not.toBeInTheDocument()
  })
})
