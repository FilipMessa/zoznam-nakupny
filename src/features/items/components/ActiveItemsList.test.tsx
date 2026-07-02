import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { ActiveItemsList } from './ActiveItemsList'
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

describe('ActiveItemsList', () => {
  it('renders every active item passed in', () => {
    const items = [
      makeActiveItem({ id: 'a', text: 'mlieko', activeOrder: 1 }),
      makeActiveItem({ id: 'b', text: 'vajcia', activeOrder: 2 }),
    ]

    render(<ActiveItemsList items={items} onCheck={vi.fn()} />)

    expect(screen.getByText('mlieko')).toBeInTheDocument()
    expect(screen.getByText('vajcia')).toBeInTheDocument()
  })

  it('shows an empty state when there are no active items', () => {
    render(<ActiveItemsList items={[]} onCheck={vi.fn()} />)

    expect(screen.getByText(/žiadne položky na kúpu/i)).toBeInTheDocument()
  })

  it('does not show the empty state when items are present', () => {
    render(
      <ActiveItemsList
        items={[makeActiveItem({ id: 'a', text: 'mlieko' })]}
        onCheck={vi.fn()}
      />,
    )

    expect(
      screen.queryByText(/žiadne položky na kúpu/i),
    ).not.toBeInTheDocument()
  })

  it('calls onCheck with the id of the item whose checkbox is clicked', async () => {
    const onCheck = vi.fn()
    const user = userEvent.setup()
    const items = [
      makeActiveItem({ id: 'a', text: 'mlieko' }),
      makeActiveItem({ id: 'b', text: 'vajcia' }),
    ]
    render(<ActiveItemsList items={items} onCheck={onCheck} />)

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1])

    expect(onCheck).toHaveBeenCalledWith('b')
  })
})
