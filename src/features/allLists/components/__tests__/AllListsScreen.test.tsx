import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import { render, screen, waitFor } from '@/test/render'
import userEvent from '@testing-library/user-event'
import { AllListsScreen } from '@/features/allLists/components/AllListsScreen'
import { useAuth } from '@/features/auth/useAuth'
import * as listApi from '@/features/lists/listApi'
import type { ShoppingList } from '@/features/lists/types'

// AllListsSection has its own suite; stub it here so this suite only exercises the screen shell
// (header, back button, one section per list).
vi.mock('@/features/allLists/components/AllListsSection', () => ({
  AllListsSection: ({ list }: { list: ShoppingList }) => (
    <div data-testid={`all-lists-section-${list.id}`}>{list.name}</div>
  ),
}))
// AllListsDoneSection has its own suite; stub it for the same reason as
// AllListsSection above.
vi.mock('@/features/allLists/components/AllListsDoneSection', () => ({
  AllListsDoneSection: () => <div data-testid="all-lists-done-section" />,
}))
vi.mock('@/features/auth/useAuth', () => ({ useAuth: vi.fn() }))
// The screen subscribes to every list's items itself (useItemsByList).
vi.mock('@/features/items/itemApi', () => ({
  subscribeItems: vi.fn(() => () => {}),
  subscribePurchaseMemory: vi.fn(() => () => {}),
}))
vi.mock('@/features/lists/listApi', () => ({
  createList: vi.fn(),
  generateListId: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)
const mockedCreateList = vi.mocked(listApi.createList)
const mockedGenerateListId = vi.mocked(listApi.generateListId)

function fakeTimestamp(millis: number): Timestamp {
  return { toMillis: () => millis } as unknown as Timestamp
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

describe('AllListsScreen', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: { uid: 'uid-1' } as never,
      authLoading: false,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders one section per list', () => {
    render(
      <AllListsScreen
        lists={[
          makeList({ id: 'list-1', name: 'Potraviny' }),
          makeList({ id: 'list-2', name: 'Drogéria' }),
        ]}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByTestId('all-lists-section-list-1')).toHaveTextContent(
      'Potraviny',
    )
    expect(screen.getByTestId('all-lists-section-list-2')).toHaveTextContent(
      'Drogéria',
    )
  })

  it('calls onClose when the back button is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<AllListsScreen lists={[makeList()]} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Späť' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows the screen title', () => {
    render(<AllListsScreen lists={[makeList()]} onClose={vi.fn()} />)

    expect(screen.getByText('Všetky zoznamy')).toBeInTheDocument()
  })

  describe('add list', () => {
    it('opens the create-list form from the header + button', async () => {
      const user = userEvent.setup()
      render(<AllListsScreen lists={[makeList()]} onClose={vi.fn()} />)

      expect(screen.queryByText('Nový zoznam')).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Pridať zoznam' }))

      expect(screen.getByText('Nový zoznam')).toBeInTheDocument()
    })

    it('creates the list, closes the form, and stays on the All Lists screen', async () => {
      mockedGenerateListId.mockReturnValue('list-new')
      mockedCreateList.mockResolvedValue()
      const onClose = vi.fn()
      const user = userEvent.setup()
      render(<AllListsScreen lists={[makeList()]} onClose={onClose} />)

      await user.click(screen.getByRole('button', { name: 'Pridať zoznam' }))
      await user.type(screen.getByLabelText('Názov zoznamu'), 'Víkend')
      await user.click(screen.getByRole('button', { name: 'Vytvoriť' }))

      expect(mockedCreateList).toHaveBeenCalledWith(
        'Víkend',
        'uid-1',
        'list-new',
      )
      await waitFor(() =>
        expect(screen.queryByText('Nový zoznam')).not.toBeInTheDocument(),
      )
      expect(onClose).not.toHaveBeenCalled()
    })

    it('shows an error and keeps the form open when creating fails', async () => {
      mockedGenerateListId.mockReturnValue('list-new')
      mockedCreateList.mockRejectedValue(new Error('boom'))
      const user = userEvent.setup()
      render(<AllListsScreen lists={[makeList()]} onClose={vi.fn()} />)

      await user.click(screen.getByRole('button', { name: 'Pridať zoznam' }))
      await user.type(screen.getByLabelText('Názov zoznamu'), 'Víkend')
      await user.click(screen.getByRole('button', { name: 'Vytvoriť' }))

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Niečo sa pokazilo',
      )
      expect(screen.getByText('Nový zoznam')).toBeInTheDocument()
    })

    it('closes the form without creating when cancelled', async () => {
      const user = userEvent.setup()
      render(<AllListsScreen lists={[makeList()]} onClose={vi.fn()} />)

      await user.click(screen.getByRole('button', { name: 'Pridať zoznam' }))
      await user.click(screen.getByRole('button', { name: 'Zatvoriť' }))

      expect(screen.queryByText('Nový zoznam')).not.toBeInTheDocument()
      expect(mockedCreateList).not.toHaveBeenCalled()
    })
  })
})
