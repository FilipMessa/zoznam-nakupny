import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import { render, screen } from '@/test/render'
import userEvent from '@testing-library/user-event'
import { ShoppingListScreen } from './ShoppingListScreen'
import { useAuth } from '@/features/auth/useAuth'
import { useItems } from '@/features/items/useItems'
import * as itemService from '@/features/items/itemService'
import type { ShoppingItem } from '@/features/items/types'

vi.mock('@/features/auth/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('@/features/items/useItems', () => ({ useItems: vi.fn() }))
// The screen imports the whole itemService; mock every function it calls so no
// test touches real Firestore. Only addItem matters here.
vi.mock('@/features/items/itemService', () => ({
  addItem: vi.fn(),
  checkItem: vi.fn(),
  uncheckItem: vi.fn(),
  deleteItem: vi.fn(),
  editItemText: vi.fn(),
  clearDoneItems: vi.fn(),
  reorderItem: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)
const mockedUseItems = vi.mocked(useItems)
const mockedAddItem = vi.mocked(itemService.addItem)

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

describe('ShoppingListScreen — scroll new item into view', () => {
  let scrollIntoView: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    mockedUseAuth.mockReturnValue({
      user: { uid: 'uid-1' } as never,
      authLoading: false,
    })
    mockedAddItem.mockResolvedValue('c')
  })

  afterEach(() => {
    scrollIntoView.mockRestore()
    vi.clearAllMocks()
  })

  it('scrolls the just-added item into view once it arrives in the snapshot', async () => {
    const initial = [
      makeItem({ id: 'a', activeOrder: 1 }),
      makeItem({ id: 'b', activeOrder: 2 }),
    ]
    mockedUseItems.mockReturnValue({ items: initial, itemsLoading: false })

    const { rerender } = render(<ShoppingListScreen listId="list-1" />)

    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: /položka/i }), 'chlieb')
    await user.click(screen.getByRole('button', { name: /pridať/i }))

    // The write has been requested but the new row hasn't arrived yet.
    expect(scrollIntoView).not.toHaveBeenCalled()

    // The realtime snapshot now delivers the appended item.
    mockedUseItems.mockReturnValue({
      items: [
        ...initial,
        makeItem({ id: 'c', text: 'chlieb', activeOrder: 3 }),
      ],
      itemsLoading: false,
    })
    rerender(<ShoppingListScreen listId="list-1" />)

    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    const newRow = document.querySelector('[data-swipe-row="c"]')
    expect(scrollIntoView.mock.instances[0]).toBe(newRow)
  })

  it('does not scroll when a new item arrives without a preceding local add', () => {
    const initial = [makeItem({ id: 'a', activeOrder: 1 })]
    mockedUseItems.mockReturnValue({ items: initial, itemsLoading: false })

    const { rerender } = render(<ShoppingListScreen listId="list-1" />)

    // A remote family member's add arrives — items grow, but the local user
    // never submitted, so the scroll flag is off and the view stays put.
    mockedUseItems.mockReturnValue({
      items: [
        ...initial,
        makeItem({ id: 'z', text: 'remote', activeOrder: 2 }),
      ],
      itemsLoading: false,
    })
    rerender(<ShoppingListScreen listId="list-1" />)

    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})
