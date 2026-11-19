import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import { render, screen, waitFor } from '@/test/render'
import userEvent from '@testing-library/user-event'
import { ListsScreen } from '@/screens/ListsScreen'
import { useAuth } from '@/features/auth/useAuth'
import { useLists } from '@/features/lists/useLists'
import { useSelectedListId } from '@/features/lists/useSelectedListId'
import * as listApi from '@/features/lists/listApi'
import type { ShoppingList } from '@/features/lists/types'

vi.mock('@/features/auth/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('@/features/lists/useLists', () => ({ useLists: vi.fn() }))
vi.mock('@/features/lists/useSelectedListId', () => ({
  useSelectedListId: vi.fn(),
}))
vi.mock('@/features/lists/listApi', () => ({
  createList: vi.fn(),
  renameList: vi.fn(),
  deleteList: vi.fn(),
}))
// ListHeader calls signOutUser directly; keep authApi (and its Firebase
// initialization) out of this suite.
vi.mock('@/features/auth/authApi', () => ({ signOutUser: vi.fn() }))
// The selected list's items screen has its own suite; stub it so this one
// never touches useItems/Firestore.
vi.mock('@/features/items/components/ShoppingListScreen', () => ({
  ShoppingListScreen: () => <div data-testid="shopping-list-screen" />,
}))
// AllListsScreen has its own suite; stub it so this one never touches
// useItems/Firestore for every list.
vi.mock('@/features/allLists/components/AllListsScreen', () => ({
  AllListsScreen: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="all-lists-screen">
      <button type="button" onClick={onClose}>
        Späť
      </button>
    </div>
  ),
}))

const mockedUseAuth = vi.mocked(useAuth)
const mockedUseLists = vi.mocked(useLists)
const mockedUseSelectedListId = vi.mocked(useSelectedListId)
const mockedCreateList = vi.mocked(listApi.createList)
const mockedRenameList = vi.mocked(listApi.renameList)
const mockedDeleteList = vi.mocked(listApi.deleteList)

function fakeTimestamp(millis: number): Timestamp {
  return { toMillis: () => millis } as unknown as Timestamp
}

function makeList(overrides: Partial<ShoppingList> = {}): ShoppingList {
  return {
    id: 'list-1',
    name: 'Týždenný nákup',
    createdAt: fakeTimestamp(0),
    createdBy: 'uid-1',
    pendingSync: false,
    ...overrides,
  }
}

const selectList = vi.fn()

beforeEach(() => {
  mockedUseAuth.mockReturnValue({
    user: { uid: 'uid-1' } as never,
    authLoading: false,
  })
  mockedUseLists.mockReturnValue({ lists: [makeList()], listsLoading: false })
  mockedUseSelectedListId.mockReturnValue({
    selectedListId: 'list-1',
    selectList,
  })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('ListsScreen — empty state', () => {
  beforeEach(() => {
    mockedUseLists.mockReturnValue({ lists: [], listsLoading: false })
    mockedUseSelectedListId.mockReturnValue({
      selectedListId: null,
      selectList,
    })
  })

  it('shows the empty state and opens the create form from it', async () => {
    render(<ListsScreen />)

    expect(screen.getByText('Zatiaľ žiadne zoznamy')).toBeInTheDocument()
    expect(screen.queryByText('Nový zoznam')).not.toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /vytvoriť zoznam/i }))

    expect(screen.getByText('Nový zoznam')).toBeInTheDocument()
  })
})

describe('ListsScreen — create list', () => {
  async function openCreateForm() {
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Prepnúť zoznam' }))
    await user.click(
      screen.getByRole('button', { name: /vytvoriť nový zoznam/i }),
    )
    return user
  }

  it('creates a list, selects it, and closes the form', async () => {
    mockedCreateList.mockResolvedValue('list-new')
    render(<ListsScreen />)

    const user = await openCreateForm()
    await user.type(screen.getByLabelText('Názov zoznamu'), 'Víkend')
    await user.click(screen.getByRole('button', { name: 'Vytvoriť' }))

    expect(mockedCreateList).toHaveBeenCalledWith('Víkend', 'uid-1')
    expect(selectList).toHaveBeenCalledWith('list-new')
    await waitFor(() =>
      expect(screen.queryByText('Nový zoznam')).not.toBeInTheDocument(),
    )
  })

  it('shows an error and keeps the form open when creating fails', async () => {
    mockedCreateList.mockRejectedValue(new Error('boom'))
    render(<ListsScreen />)

    const user = await openCreateForm()
    await user.type(screen.getByLabelText('Názov zoznamu'), 'Víkend')
    await user.click(screen.getByRole('button', { name: 'Vytvoriť' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Niečo sa pokazilo',
    )
    expect(screen.getByText('Nový zoznam')).toBeInTheDocument()
    expect(selectList).not.toHaveBeenCalled()
  })

  it('closes the form without creating when cancelled', async () => {
    render(<ListsScreen />)

    const user = await openCreateForm()
    await user.click(screen.getByRole('button', { name: 'Zatvoriť' }))

    expect(screen.queryByText('Nový zoznam')).not.toBeInTheDocument()
    expect(mockedCreateList).not.toHaveBeenCalled()
  })
})

describe('ListsScreen — rename list', () => {
  it('renames the selected list and closes the form', async () => {
    mockedRenameList.mockResolvedValue(undefined)
    render(<ListsScreen />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Premenovať' }))

    const input = screen.getByLabelText('List name')
    expect(input).toHaveValue('Týždenný nákup')

    await user.clear(input)
    await user.type(input, 'Mesačný nákup')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(mockedRenameList).toHaveBeenCalledWith('list-1', 'Mesačný nákup')
    await waitFor(() =>
      expect(screen.queryByText('Premenovať zoznam')).not.toBeInTheDocument(),
    )
  })

  it('shows an error and keeps the form open when renaming fails', async () => {
    mockedRenameList.mockRejectedValue(new Error('boom'))
    render(<ListsScreen />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Premenovať' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong',
    )
    expect(screen.getByText('Premenovať zoznam')).toBeInTheDocument()
  })
})

describe('ListsScreen — delete list', () => {
  it('deletes the selected list after confirmation', async () => {
    mockedDeleteList.mockResolvedValue(undefined)
    render(<ListsScreen />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Zmazať zoznam' }))

    expect(screen.getByText(/Zmaže sa zoznam/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Zmazať' }))

    expect(mockedDeleteList).toHaveBeenCalledWith('list-1')
    await waitFor(() =>
      expect(screen.queryByText(/Zmaže sa zoznam/)).not.toBeInTheDocument(),
    )
  })

  it('keeps the list when the confirmation is cancelled', async () => {
    render(<ListsScreen />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Zmazať zoznam' }))
    await user.click(screen.getByRole('button', { name: 'Zrušiť' }))

    expect(mockedDeleteList).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(screen.queryByText(/Zmaže sa zoznam/)).not.toBeInTheDocument(),
    )
  })
})

describe('ListsScreen — list switcher', () => {
  it('opens the switcher and switches to the create form from it', async () => {
    render(<ListsScreen />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Prepnúť zoznam' }))

    const createFromSwitcher = screen.getByRole('button', {
      name: /vytvoriť nový zoznam/i,
    })
    expect(createFromSwitcher).toBeInTheDocument()

    await user.click(createFromSwitcher)

    expect(screen.getByText('Nový zoznam')).toBeInTheDocument()
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: /vytvoriť nový zoznam/i }),
      ).not.toBeInTheDocument(),
    )
  })
})

describe('ListsScreen — all lists screen', () => {
  it('opens the all-lists screen and returns to the single-list flow on back', async () => {
    render(<ListsScreen />)

    const user = userEvent.setup()
    expect(screen.queryByTestId('all-lists-screen')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Všetky zoznamy' }))

    expect(screen.getByTestId('all-lists-screen')).toBeInTheDocument()
    expect(screen.queryByTestId('shopping-list-screen')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Späť' }))

    expect(screen.queryByTestId('all-lists-screen')).not.toBeInTheDocument()
    expect(screen.getByTestId('shopping-list-screen')).toBeInTheDocument()
  })

  it('falls back to the empty state (not a stale all-lists screen) once every list is gone', async () => {
    const { rerender } = render(<ListsScreen />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Všetky zoznamy' }))
    expect(screen.getByTestId('all-lists-screen')).toBeInTheDocument()

    // Every list disappears while the all-lists screen is open (e.g. the
    // last list was deleted by another Member) -- the underlying
    // allListsOpen flag must not survive this, or creating a new list from
    // the resulting empty state would silently re-enter the all-lists
    // screen instead of landing on the normal single-list flow.
    mockedUseLists.mockReturnValue({ lists: [], listsLoading: false })
    mockedUseSelectedListId.mockReturnValue({
      selectedListId: null,
      selectList,
    })
    rerender(<ListsScreen />)

    expect(screen.queryByTestId('all-lists-screen')).not.toBeInTheDocument()
    expect(screen.getByText('Zatiaľ žiadne zoznamy')).toBeInTheDocument()

    const newList = makeList({ id: 'list-new' })
    mockedCreateList.mockResolvedValue(newList.id)
    mockedUseLists.mockReturnValue({ lists: [newList], listsLoading: false })
    mockedUseSelectedListId.mockReturnValue({
      selectedListId: newList.id,
      selectList,
    })
    rerender(<ListsScreen />)

    expect(screen.queryByTestId('all-lists-screen')).not.toBeInTheDocument()
    expect(screen.getByTestId('shopping-list-screen')).toBeInTheDocument()
  })
})
