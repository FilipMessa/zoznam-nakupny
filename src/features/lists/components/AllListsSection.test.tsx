import { useState } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import { render, screen, fireEvent } from '@/test/render'
import userEvent from '@testing-library/user-event'
import { AllListsSection, type AllListsSectionProps } from './AllListsSection'
import { useAuth } from '@/features/auth/useAuth'
import { useItems } from '@/features/items/useItems'
import * as itemService from '@/features/items/itemApi'
import type { ShoppingItem } from '@/features/items/types'
import type { ShoppingList } from '@/features/lists/types'

vi.mock('@/features/auth/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('@/features/items/useItems', () => ({ useItems: vi.fn() }))
vi.mock('@/features/items/itemApi', () => ({
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
    onDoneItemsChange: vi.fn(),
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

  it('reports its done items up without rendering them', () => {
    const onDoneItemsChange = vi.fn()
    const doneItem = makeItem({ id: 'd', text: 'chlieb', status: 'done' })
    mockedUseItems.mockReturnValue({
      items: [makeItem({ id: 'a', text: 'mlieko' }), doneItem],
      itemsLoading: false,
    })

    render(<AllListsSection {...defaultProps({ onDoneItemsChange })} />)

    expect(onDoneItemsChange).toHaveBeenCalledWith('list-1', [doneItem])
    expect(screen.queryByText(doneItem.text)).not.toBeInTheDocument()
  })

  it('renders a list-color dot in the header', () => {
    mockedUseItems.mockReturnValue({ items: [], itemsLoading: false })

    render(<AllListsSection {...defaultProps()} />)

    expect(screen.getByTestId('list-color-dot')).toBeInTheDocument()
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

  it("calls checkItem with this section's listId when an item is checked", async () => {
    mockedUseItems.mockReturnValue({
      items: [makeItem({ id: 'a', text: 'mlieko' })],
      itemsLoading: false,
    })
    mockedCheckItem.mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <AllListsSection
        {...defaultProps({ list: makeList({ id: 'list-42' }) })}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: 'mlieko' }))

    expect(mockedCheckItem).toHaveBeenCalledWith('list-42', 'a', 'uid-1')
  })

  it("calls deleteItem with this section's listId when an item is deleted", async () => {
    mockedUseItems.mockReturnValue({
      items: [makeItem({ id: 'a', text: 'mlieko' })],
      itemsLoading: false,
    })
    mockedDeleteItem.mockResolvedValue(undefined)
    const user = userEvent.setup()

    const { container } = render(
      <AllListsSection
        {...defaultProps({ list: makeList({ id: 'list-42' }) })}
      />,
    )

    // The desktop icon button is `display: none` below the `md` breakpoint,
    // which jsdom's default viewport matches, so it's excluded from the
    // accessibility tree -- query by attribute instead of role, same as
    // ActiveItemRow.test.tsx does for this same button.
    await user.click(
      container.querySelector<HTMLButtonElement>(
        'button[aria-label="Zmazať"]',
      )!,
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

  it('does not re-render when re-rendered with referentially identical props (React.memo)', () => {
    mockedUseItems.mockReturnValue({ items: [], itemsLoading: false })
    const props = defaultProps()

    // mockedUseItems is called once per AllListsSection function-body
    // execution, so its call count is a proxy for "did this component
    // actually re-render" -- a re-render triggered by an unrelated sibling
    // (forceRerender here stands in for e.g. another section toggling)
    // should be skipped entirely by React.memo when props haven't changed.
    function Harness() {
      const [, forceRerender] = useState(0)
      return (
        <>
          <button type="button" onClick={() => forceRerender((n) => n + 1)}>
            rerender
          </button>
          <AllListsSection {...props} />
        </>
      )
    }

    render(<Harness />)
    const callsBefore = mockedUseItems.mock.calls.length

    fireEvent.click(screen.getByRole('button', { name: 'rerender' }))

    expect(mockedUseItems.mock.calls.length).toBe(callsBefore)
  })
})
