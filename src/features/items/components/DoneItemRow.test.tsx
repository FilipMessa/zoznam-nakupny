import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

  it('calls onDelete with the item id when the delete button is clicked', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()
    render(
      <DoneItemRow
        item={makeDoneItem({ id: 'item-9' })}
        onUncheck={vi.fn()}
        onDelete={onDelete}
      />,
    )

    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(onDelete).toHaveBeenCalledWith('item-9')
  })
})
