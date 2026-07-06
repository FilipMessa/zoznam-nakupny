import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import { render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { AllListsSection, type AllListsSectionProps } from './AllListsSection'
import { useAuth } from '../../auth/useAuth'
import { useItems } from '../../items/useItems'
import * as itemService from '../../items/itemService'
import type { ShoppingItem } from '../../items/types'
import type { ShoppingList } from '../types'

vi.mock('../../auth/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../../items/useItems', () => ({ useItems: vi.fn() }))
vi.mock('../../items/itemService', () => ({
  checkItem: vi.fn(),
  uncheckItem: vi.fn(),
  deleteItem: vi.fn(),
  editItemText: vi.fn(),
  clearDoneItems: vi.fn(),
  reorderItem: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)
const mockedUseItems = vi.mocked(useItems)
const mockedCheckItem = vi.mocked(itemService.checkItem)
const mockedDeleteItem = vi.mocked(itemService.deleteItem)

function fakeTimestamp(millis: number): Timestamp {
  return { toMillis: () => millis } as unknown as Timestamp
}

function makeItem(overrides: Partial<ShoppingItem> = {}): ShoppingItem {
  return {
    id: 'item-1',
    text: 'mlieko',
    status: 'active',
    activeOrder: 1,
    completedAt: null,
    completedBy: null,
    createdAt: fakeTimestamp(0),
    createdBy: 'uid-1',
    updatedAt: fakeTimestamp(0),
    ...overrides,
  }
}

function makeList(overrides: Partial<ShoppingList> = {}): ShoppingList {
  return {
    id: 'list-1',
    name: 'Potraviny',
    createdAt: fakeTimestamp(0),
    createdBy: 'uid-1',
    ...overrides,
  }
}

function defaultProps(
  overrides: Partial<AllListsSectionProps> = {},
): AllListsSectionProps {
  return {
    list: makeList(),
    expanded: true,
    onToggle: vi.fn(),
    onActiveItemsChange: vi.fn(),
    isAddTarget: false,
    onSelectAddTarget: vi.fn(),
    mainScrollRef: { current: null },
    onRegisterScrollRequester: vi.fn(),
    ...overrides,
  }
}

describe('AllListsSection', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: { uid: 'uid-1' } as never,
      authLoading: false,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows the list name and active item count in the header', () => {
    mockedUseItems.mockReturnValue({
      items: [makeItem({ id: 'a' }), makeItem({ id: 'b' })],
      itemsLoading: false,
    })

    render(<AllListsSection {...defaultProps()} />)

    expect(screen.getByText('Potraviny · 2')).toBeInTheDocument()
  })

  it('renders active items when expanded', () => {
    mockedUseItems.mockReturnValue({
      items: [makeItem({ id: 'a', text: 'mlieko' })],
      itemsLoading: false,
    })

    render(<AllListsSection {...defaultProps()} />)

    expect(screen.getByText('mlieko')).toBeInTheDocument()
  })

  it('does not render items when collapsed', () => {
    mockedUseItems.mockReturnValue({
      items: [makeItem({ id: 'a', text: 'mlieko' })],
      itemsLoading: false,
    })

    render(<AllListsSection {...defaultProps({ expanded: false })} />)

    expect(screen.queryByText('mlieko')).not.toBeInTheDocument()
  })

  it('shows an empty state when the list has no active items', () => {
    mockedUseItems.mockReturnValue({ items: [], itemsLoading: false })

    render(<AllListsSection {...defaultProps()} />)

    expect(screen.getByText('Žiadne položky na kúpu.')).toBeInTheDocument()
  })

  it('calls onToggle when the chevron button is clicked', async () => {
    const onToggle = vi.fn()
    mockedUseItems.mockReturnValue({ items: [], itemsLoading: false })
    const user = userEvent.setup()

    render(<AllListsSection {...defaultProps({ onToggle })} />)

    await user.click(screen.getByRole('button', { name: 'Zbaliť' }))

    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('calls onSelectAddTarget (not onToggle) when the list name is clicked', async () => {
    const onToggle = vi.fn()
    const onSelectAddTarget = vi.fn()
    mockedUseItems.mockReturnValue({ items: [], itemsLoading: false })
    const user = userEvent.setup()

    render(
      <AllListsSection {...defaultProps({ onToggle, onSelectAddTarget })} />,
    )

    await user.click(screen.getByRole('button', { name: /potraviny/i }))

    expect(onSelectAddTarget).toHaveBeenCalledTimes(1)
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('marks the header as current when this list is the add target', () => {
    mockedUseItems.mockReturnValue({ items: [], itemsLoading: false })

    render(<AllListsSection {...defaultProps({ isAddTarget: true })} />)

    expect(screen.getByRole('button', { name: /potraviny/i })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('does not mark the header as current when this list is not the add target', () => {
    mockedUseItems.mockReturnValue({ items: [], itemsLoading: false })

    render(<AllListsSection {...defaultProps({ isAddTarget: false })} />)

    expect(
      screen.getByRole('button', { name: /potraviny/i }),
    ).not.toHaveAttribute('aria-current')
  })

  it('calls checkItem with this section\'s listId when an item is checked', async () => {
    mockedUseItems.mockReturnValue({
      items: [makeItem({ id: 'a', text: 'mlieko' })],
      itemsLoading: false,
    })
    mockedCheckItem.mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <AllListsSection {...defaultProps({ list: makeList({ id: 'list-42' }) })} />,
    )

    await user.click(screen.getByRole('checkbox', { name: 'mlieko' }))

    expect(mockedCheckItem).toHaveBeenCalledWith('list-42', 'a', 'uid-1')
  })

  it('calls deleteItem with this section\'s listId when an item is deleted', async () => {
    mockedUseItems.mockReturnValue({
      items: [makeItem({ id: 'a', text: 'mlieko' })],
      itemsLoading: false,
    })
    mockedDeleteItem.mockResolvedValue(undefined)
    const user = userEvent.setup()

    const { container } = render(
      <AllListsSection {...defaultProps({ list: makeList({ id: 'list-42' }) })} />,
    )

    // The desktop icon button is `display: none` below the `md` breakpoint,
    // which jsdom's default viewport matches, so it's excluded from the
    // accessibility tree -- query by attribute instead of role, same as
    // ActiveItemRow.test.tsx does for this same button.
    await user.click(
      container.querySelector<HTMLButtonElement>('button[aria-label="Zmazať"]')!,
    )

    expect(mockedDeleteItem).toHaveBeenCalledWith('list-42', 'a')
  })

  it('shows a pending-sync indicator when the list has not synced yet', () => {
    mockedUseItems.mockReturnValue({ items: [], itemsLoading: false })

    render(
      <AllListsSection
        {...defaultProps({ list: makeList({ pendingSync: true }) })}
      />,
    )

    expect(screen.getByTitle('Zoznam čaká na odoslanie')).toBeInTheDocument()
  })
})
