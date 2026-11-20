import { useState } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import { render, screen, fireEvent } from '@/test/render'
import userEvent from '@testing-library/user-event'
import {
  AllListsSection,
  type AllListsSectionProps,
} from '@/features/allLists/components/AllListsSection'
import { useAuth } from '@/features/auth/useAuth'
import { useAllListsSection } from '@/features/allLists/useAllListsSection'
import * as itemApi from '@/features/items/itemApi'
import type { ShoppingItem } from '@/features/items/types'
import type { ShoppingList } from '@/features/lists/types'

vi.mock('@/features/auth/useAuth', () => ({ useAuth: vi.fn() }))
// Wrapped (not replaced) so the React.memo test below can count renders.
vi.mock('@/features/allLists/useAllListsSection', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/features/allLists/useAllListsSection')
    >()
  return { useAllListsSection: vi.fn(actual.useAllListsSection) }
})
vi.mock('@/features/items/itemApi', () => ({
  checkItem: vi.fn(),
  uncheckItem: vi.fn(),
  deleteItem: vi.fn(),
  editItemText: vi.fn(),
  clearDoneItems: vi.fn(),
  reorderItem: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)
const mockedUseAllListsSection = vi.mocked(useAllListsSection)
const mockedCheckItem = vi.mocked(itemApi.checkItem)
const mockedDeleteItem = vi.mocked(itemApi.deleteItem)

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
    activeItems: [],
    expanded: true,
    onToggle: vi.fn(),
    isAddTarget: false,
    onSelectAddTarget: vi.fn(),
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
    const activeItems = [makeItem({ id: 'a' }), makeItem({ id: 'b' })]

    render(<AllListsSection {...defaultProps({ activeItems })} />)

    expect(screen.getByText('Potraviny · 2')).toBeInTheDocument()
  })

  it('renders a list-color dot in the header', () => {
    render(<AllListsSection {...defaultProps()} />)

    expect(screen.getByTestId('list-color-dot')).toBeInTheDocument()
  })

  it('renders active items when expanded', () => {
    const activeItems = [makeItem({ id: 'a', text: 'mlieko' })]

    render(<AllListsSection {...defaultProps({ activeItems })} />)

    expect(screen.getByText('mlieko')).toBeInTheDocument()
  })

  it('does not render items when collapsed', () => {
    const activeItems = [makeItem({ id: 'a', text: 'mlieko' })]

    render(
      <AllListsSection {...defaultProps({ activeItems, expanded: false })} />,
    )

    expect(screen.queryByText('mlieko')).not.toBeInTheDocument()
  })

  it('shows an empty state when the list has no active items', () => {
    render(<AllListsSection {...defaultProps()} />)

    expect(screen.getByText('Žiadne položky na kúpu.')).toBeInTheDocument()
  })

  it('calls onToggle when the chevron button is clicked', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()

    render(<AllListsSection {...defaultProps({ onToggle })} />)

    await user.click(screen.getByRole('button', { name: 'Zbaliť' }))

    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('calls onSelectAddTarget (not onToggle) when the list name is clicked', async () => {
    const onToggle = vi.fn()
    const onSelectAddTarget = vi.fn()
    const user = userEvent.setup()

    render(
      <AllListsSection {...defaultProps({ onToggle, onSelectAddTarget })} />,
    )

    await user.click(screen.getByRole('button', { name: /potraviny/i }))

    expect(onSelectAddTarget).toHaveBeenCalledTimes(1)
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('marks the header as current when this list is the add target', () => {
    render(<AllListsSection {...defaultProps({ isAddTarget: true })} />)

    expect(screen.getByRole('button', { name: /potraviny/i })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('does not mark the header as current when this list is not the add target', () => {
    render(<AllListsSection {...defaultProps({ isAddTarget: false })} />)

    expect(
      screen.getByRole('button', { name: /potraviny/i }),
    ).not.toHaveAttribute('aria-current')
  })

  it("calls checkItem with this section's listId when an item is checked", async () => {
    const activeItems = [makeItem({ id: 'a', text: 'mlieko' })]
    mockedCheckItem.mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <AllListsSection
        {...defaultProps({ activeItems, list: makeList({ id: 'list-42' }) })}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: 'mlieko' }))

    expect(mockedCheckItem).toHaveBeenCalledWith('list-42', 'a', 'uid-1')
  })

  it("calls deleteItem with this section's listId when an item is deleted", async () => {
    const activeItems = [makeItem({ id: 'a', text: 'mlieko' })]
    mockedDeleteItem.mockResolvedValue(undefined)
    const user = userEvent.setup()

    const { container } = render(
      <AllListsSection
        {...defaultProps({ activeItems, list: makeList({ id: 'list-42' }) })}
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
    render(
      <AllListsSection
        {...defaultProps({ list: makeList({ pendingSync: true }) })}
      />,
    )

    expect(screen.getByTitle('Zoznam čaká na odoslanie')).toBeInTheDocument()
  })

  it('does not re-render when re-rendered with referentially identical props (React.memo)', () => {
    const props = defaultProps()

    // useAllListsSection is called once per AllListsSection function-body
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
    const callsBefore = mockedUseAllListsSection.mock.calls.length

    fireEvent.click(screen.getByRole('button', { name: 'rerender' }))

    expect(mockedUseAllListsSection.mock.calls.length).toBe(callsBefore)
  })
})
