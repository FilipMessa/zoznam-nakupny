import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/render'
import userEvent from '@testing-library/user-event'
import { ListSwitcherItem } from './ListSwitcherItem'
import type { ShoppingList } from '@/features/lists/types'

function makeList(overrides: Partial<ShoppingList> = {}): ShoppingList {
  return {
    id: 'list-a',
    name: 'Groceries',
    createdAt: null as never,
    createdBy: 'u1',
    ...overrides,
  }
}

describe('ListSwitcherItem', () => {
  it('renders the list name', () => {
    render(
      <ListSwitcherItem
        list={makeList({ name: 'Groceries' })}
        selected={false}
        onSelect={vi.fn()}
      />,
    )

    expect(screen.getByText('Groceries')).toBeInTheDocument()
  })

  it('calls onSelect with the list id when clicked', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <ListSwitcherItem
        list={makeList({ id: 'list-42' })}
        selected={false}
        onSelect={onSelect}
      />,
    )

    await user.click(screen.getByRole('button'))

    expect(onSelect).toHaveBeenCalledWith('list-42')
  })

  it('shows a pending-sync badge when the list has not synced yet', () => {
    render(
      <ListSwitcherItem
        list={makeList({ pendingSync: true })}
        selected={false}
        onSelect={vi.fn()}
      />,
    )

    expect(screen.getByTitle('Zoznam čaká na odoslanie')).toBeInTheDocument()
  })

  it('does not show a pending-sync badge once the list has synced', () => {
    render(
      <ListSwitcherItem
        list={makeList({ pendingSync: false })}
        selected={false}
        onSelect={vi.fn()}
      />,
    )

    expect(
      screen.queryByTitle('Zoznam čaká na odoslanie'),
    ).not.toBeInTheDocument()
  })
})
