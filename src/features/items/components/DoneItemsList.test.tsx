import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { DoneItemsList } from './DoneItemsList'
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

describe('DoneItemsList', () => {
  it('renders every done item passed in', () => {
    const items = [
      makeDoneItem({ id: 'a', text: 'mlieko' }),
      makeDoneItem({ id: 'b', text: 'vajcia' }),
    ]

    render(<DoneItemsList items={items} onUncheck={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('mlieko')).toBeInTheDocument()
    expect(screen.getByText('vajcia')).toBeInTheDocument()
  })

  it('shows an empty state when there are no done items', () => {
    render(<DoneItemsList items={[]} onUncheck={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText(/zatiaľ nič hotové/i)).toBeInTheDocument()
  })

  it('does not show the empty state when items are present', () => {
    render(
      <DoneItemsList
        items={[makeDoneItem({ id: 'a', text: 'mlieko' })]}
        onUncheck={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(
      screen.queryByText(/zatiaľ nič hotové/i),
    ).not.toBeInTheDocument()
  })

  it('calls onUncheck with the id of the item whose checkbox is clicked', async () => {
    const onUncheck = vi.fn()
    const user = userEvent.setup()
    const items = [
      makeDoneItem({ id: 'a', text: 'mlieko' }),
      makeDoneItem({ id: 'b', text: 'vajcia' }),
    ]
    render(<DoneItemsList items={items} onUncheck={onUncheck} onDelete={vi.fn()} />)

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1])

    expect(onUncheck).toHaveBeenCalledWith('b')
  })

  it('calls onDelete with the id of the item whose delete button is clicked', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()
    const items = [
      makeDoneItem({ id: 'a', text: 'mlieko' }),
      makeDoneItem({ id: 'b', text: 'vajcia' }),
    ]
    const { container } = render(
      <DoneItemsList items={items} onUncheck={vi.fn()} onDelete={onDelete} />,
    )

    const deleteButtons = container.querySelectorAll<HTMLButtonElement>(
      'button.icon-btn',
    )
    await user.click(deleteButtons[1])

    expect(onDelete).toHaveBeenCalledWith('b')
  })
})
