import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/render'
import userEvent from '@testing-library/user-event'
import { ActiveItemsList, type ActiveItemsListProps } from './ActiveItemsList'
import type { ShoppingItem } from '@/features/items/types'

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

function makeProps(
  overrides: Partial<ActiveItemsListProps> = {},
): ActiveItemsListProps {
  return {
    items: [],
    onCheck: vi.fn(),
    onDelete: vi.fn(),
    editingItemId: null,
    onStartEdit: vi.fn(),
    onSubmitEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    openSwipeItemId: null,
    onSwipeOpenChange: vi.fn(),
    ...overrides,
  }
}

describe('ActiveItemsList', () => {
  it('renders every active item passed in', () => {
    const items = [
      makeActiveItem({ id: 'a', text: 'mlieko', activeOrder: 1 }),
      makeActiveItem({ id: 'b', text: 'vajcia', activeOrder: 2 }),
    ]

    render(<ActiveItemsList {...makeProps({ items })} />)

    expect(screen.getByText('mlieko')).toBeInTheDocument()
    expect(screen.getByText('vajcia')).toBeInTheDocument()
  })

  it('shows an empty state when there are no active items', () => {
    render(<ActiveItemsList {...makeProps({ items: [] })} />)

    expect(screen.getByText(/žiadne položky na kúpu/i)).toBeInTheDocument()
  })

  it('does not show the empty state when items are present', () => {
    render(
      <ActiveItemsList
        {...makeProps({ items: [makeActiveItem({ id: 'a', text: 'mlieko' })] })}
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
    render(<ActiveItemsList {...makeProps({ items, onCheck })} />)

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1])

    expect(onCheck).toHaveBeenCalledWith('b')
  })

  it('calls onDelete with the id of the item whose delete action is clicked', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()
    const items = [
      makeActiveItem({ id: 'a', text: 'mlieko' }),
      makeActiveItem({ id: 'b', text: 'vajcia' }),
    ]
    const { container } = render(
      <ActiveItemsList {...makeProps({ items, onDelete })} />,
    )

    // The desktop icon buttons are `display: none` below the `md`
    // breakpoint, which jsdom's default (zero-width) viewport matches, so
    // they're excluded from the accessibility tree -- query by attribute.
    const deleteButtons = container.querySelectorAll<HTMLButtonElement>(
      'button[aria-label="Zmazať"]',
    )
    await user.click(deleteButtons[1])

    expect(onDelete).toHaveBeenCalledWith('b')
  })

  it('calls onStartEdit with the id of the item whose edit action is clicked', async () => {
    const onStartEdit = vi.fn()
    const user = userEvent.setup()
    const items = [
      makeActiveItem({ id: 'a', text: 'mlieko' }),
      makeActiveItem({ id: 'b', text: 'vajcia' }),
    ]
    const { container } = render(
      <ActiveItemsList {...makeProps({ items, onStartEdit })} />,
    )

    const editButtons = container.querySelectorAll<HTMLButtonElement>(
      'button[aria-label="Upraviť"]',
    )
    await user.click(editButtons[1])

    expect(onStartEdit).toHaveBeenCalledWith('b')
  })

  it('renders the editing item as an inline input instead of a checkbox row', () => {
    const items = [
      makeActiveItem({ id: 'a', text: 'mlieko' }),
      makeActiveItem({ id: 'b', text: 'vajcia' }),
    ]
    render(<ActiveItemsList {...makeProps({ items, editingItemId: 'b' })} />)

    expect(screen.getByRole('textbox')).toHaveValue('vajcia')
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
  })
})
