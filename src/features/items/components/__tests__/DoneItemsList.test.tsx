import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/render'
import userEvent from '@testing-library/user-event'
import {
  DoneItemsList,
  type DoneItemsListProps,
} from '@/features/items/components/DoneItemsList'
import type { ShoppingItem } from '@/features/items/types'

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
  overrides: Partial<DoneItemsListProps> = {},
): DoneItemsListProps {
  return {
    items: [],
    onUncheck: vi.fn(),
    onDelete: vi.fn(),
    openSwipeItemId: null,
    onSwipeOpenChange: vi.fn(),
    ...overrides,
  }
}

describe('DoneItemsList', () => {
  it('renders every done item passed in', () => {
    const items = [
      makeDoneItem({ id: 'a', text: 'mlieko' }),
      makeDoneItem({ id: 'b', text: 'vajcia' }),
    ]

    render(<DoneItemsList {...makeProps({ items })} />)

    expect(screen.getByText('mlieko')).toBeInTheDocument()
    expect(screen.getByText('vajcia')).toBeInTheDocument()
  })

  it('shows an empty state when there are no done items', () => {
    render(<DoneItemsList {...makeProps({ items: [] })} />)

    expect(screen.getByText(/zatiaľ nič hotové/i)).toBeInTheDocument()
  })

  it('does not show the empty state when items are present', () => {
    render(
      <DoneItemsList
        {...makeProps({ items: [makeDoneItem({ id: 'a', text: 'mlieko' })] })}
      />,
    )

    expect(screen.queryByText(/zatiaľ nič hotové/i)).not.toBeInTheDocument()
  })

  it('calls onUncheck with the id of the item whose checkbox is clicked', async () => {
    const onUncheck = vi.fn()
    const user = userEvent.setup()
    const items = [
      makeDoneItem({ id: 'a', text: 'mlieko' }),
      makeDoneItem({ id: 'b', text: 'vajcia' }),
    ]
    render(<DoneItemsList {...makeProps({ items, onUncheck })} />)

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
      <DoneItemsList {...makeProps({ items, onDelete })} />,
    )

    // The desktop icon button is `display: none` below the `md` breakpoint,
    // which jsdom's default (zero-width) viewport matches, so it's excluded
    // from the accessibility tree -- query by attribute instead of role.
    const deleteButtons = container.querySelectorAll<HTMLButtonElement>(
      'button[aria-label="Zmazať"]',
    )
    await user.click(deleteButtons[1])

    expect(onDelete).toHaveBeenCalledWith('b')
  })
})
