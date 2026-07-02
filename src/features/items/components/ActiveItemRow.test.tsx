import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { ActiveItemRow } from './ActiveItemRow'
import type { ShoppingItem } from '../types'

function makeActiveItem(overrides: Partial<ShoppingItem> = {}): ShoppingItem {
  return {
    id: 'item-1',
    text: 'mlieko',
    status: 'active',
    activeOrder: 1,
    completedAt: null,
    completedBy: null,
    createdAt: null as unknown as ShoppingItem['createdAt'],
    createdBy: 'uid-1',
    updatedAt: null as unknown as ShoppingItem['updatedAt'],
    ...overrides,
  }
}

describe('ActiveItemRow', () => {
  it('renders the item text', () => {
    render(<ActiveItemRow item={makeActiveItem({ text: 'mlieko' })} onCheck={vi.fn()} />)

    expect(screen.getByText('mlieko')).toBeInTheDocument()
  })

  it('renders an unchecked checkbox', () => {
    render(<ActiveItemRow item={makeActiveItem()} onCheck={vi.fn()} />)

    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('calls onCheck with the item id when the checkbox is clicked', async () => {
    const onCheck = vi.fn()
    const user = userEvent.setup()
    render(
      <ActiveItemRow item={makeActiveItem({ id: 'item-42' })} onCheck={onCheck} />,
    )

    await user.click(screen.getByRole('checkbox'))

    expect(onCheck).toHaveBeenCalledWith('item-42')
  })

  it('makes the whole item row the sortable drag activator', () => {
    render(<ActiveItemRow item={makeActiveItem()} onCheck={vi.fn()} />)

    expect(
      screen.getByTestId('active-item-item-1'),
    ).toHaveAttribute('aria-roledescription', 'sortable')
    expect(
      screen.queryByRole('button', { name: /presunúť/i }),
    ).not.toBeInTheDocument()
  })
})
