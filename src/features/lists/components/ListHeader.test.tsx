import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@/test/render'
import userEvent from '@testing-library/user-event'
import { act } from '@testing-library/react'
import { ListHeader } from './ListHeader'
import { signOutUser } from '@/features/auth/authApi'

vi.mock('@/features/auth/authApi', () => ({
  signOutUser: vi.fn(),
}))

const mockedSignOutUser = vi.mocked(signOutUser)

describe('ListHeader', () => {
  beforeEach(() => {
    mockedSignOutUser.mockReset()
    mockedSignOutUser.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the list name', () => {
    render(
      <ListHeader
        listName="Groceries"
        onOpenSwitcher={vi.fn()}
        onOpenAllLists={vi.fn()}
        onRenameClick={vi.fn()}
        onDeleteClick={vi.fn()}
      />,
    )

    expect(screen.getByText('Groceries')).toBeInTheDocument()
  })

  it('calls onOpenSwitcher when the switcher trigger is clicked', async () => {
    const onOpenSwitcher = vi.fn()
    const user = userEvent.setup()
    render(
      <ListHeader
        listName="Groceries"
        onOpenSwitcher={onOpenSwitcher}
        onOpenAllLists={vi.fn()}
        onRenameClick={vi.fn()}
        onDeleteClick={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /prepnúť zoznam/i }))

    expect(onOpenSwitcher).toHaveBeenCalledTimes(1)
  })

  it('calls onOpenAllLists when the all-lists trigger is clicked', async () => {
    const onOpenAllLists = vi.fn()
    const user = userEvent.setup()
    render(
      <ListHeader
        listName="Groceries"
        onOpenSwitcher={vi.fn()}
        onOpenAllLists={onOpenAllLists}
        onRenameClick={vi.fn()}
        onDeleteClick={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /všetky zoznamy/i }))

    expect(onOpenAllLists).toHaveBeenCalledTimes(1)
  })

  it('calls onRenameClick when the rename button is clicked', async () => {
    const onRenameClick = vi.fn()
    const user = userEvent.setup()
    render(
      <ListHeader
        listName="Groceries"
        onOpenSwitcher={vi.fn()}
        onOpenAllLists={vi.fn()}
        onRenameClick={onRenameClick}
        onDeleteClick={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /premenovať/i }))

    expect(onRenameClick).toHaveBeenCalledTimes(1)
  })

  it('calls onDeleteClick when the delete-list button is clicked', async () => {
    const onDeleteClick = vi.fn()
    const user = userEvent.setup()
    render(
      <ListHeader
        listName="Groceries"
        onOpenSwitcher={vi.fn()}
        onOpenAllLists={vi.fn()}
        onRenameClick={vi.fn()}
        onDeleteClick={onDeleteClick}
      />,
    )

    await user.click(screen.getByRole('button', { name: /zmazať zoznam/i }))

    expect(onDeleteClick).toHaveBeenCalledTimes(1)
  })

  it('calls signOutUser when the sign-out button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <ListHeader
        listName="Groceries"
        onOpenSwitcher={vi.fn()}
        onOpenAllLists={vi.fn()}
        onRenameClick={vi.fn()}
        onDeleteClick={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /odhlásiť sa/i }))

    expect(mockedSignOutUser).toHaveBeenCalledTimes(1)
  })

  // Touch-target polish (Phase 7): every icon action in the header (switcher
  // trigger, rename, delete-list, sign-out) must be at least 44px tappable,
  // enforced via the shared `.icon-btn` class (min-width/min-height set from
  // --touch-target in CSS). We assert the class hook only, since jsdom
  // cannot reliably resolve CSS custom properties into computed pixels.
  it('applies the icon-btn touch-target class to every header action button', () => {
    render(
      <ListHeader
        listName="Groceries"
        onOpenSwitcher={vi.fn()}
        onOpenAllLists={vi.fn()}
        onRenameClick={vi.fn()}
        onDeleteClick={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /prepnúť zoznam/i })).toHaveClass(
      'icon-btn',
    )
    expect(screen.getByRole('button', { name: /všetky zoznamy/i })).toHaveClass(
      'icon-btn',
    )
    expect(screen.getByRole('button', { name: /premenovať/i })).toHaveClass(
      'icon-btn',
    )
    expect(screen.getByRole('button', { name: /zmazať zoznam/i })).toHaveClass(
      'icon-btn',
    )
    expect(screen.getByRole('button', { name: /odhlásiť sa/i })).toHaveClass(
      'icon-btn',
    )
  })

  it('shows the connection dot as live when online', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)

    render(
      <ListHeader
        listName="Groceries"
        onOpenSwitcher={vi.fn()}
        onOpenAllLists={vi.fn()}
        onRenameClick={vi.fn()}
        onDeleteClick={vi.fn()}
      />,
    )

    expect(screen.getByTitle('Živé spojenie')).toBeInTheDocument()
  })

  it('shows the connection dot as offline when the browser goes offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)

    render(
      <ListHeader
        listName="Groceries"
        onOpenSwitcher={vi.fn()}
        onOpenAllLists={vi.fn()}
        onRenameClick={vi.fn()}
        onDeleteClick={vi.fn()}
      />,
    )

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(screen.getByTitle('Offline')).toBeInTheDocument()
  })

  it('shows a pending-sync badge when the selected list has not synced yet', () => {
    render(
      <ListHeader
        listName="Groceries"
        pendingSync={true}
        onOpenSwitcher={vi.fn()}
        onOpenAllLists={vi.fn()}
        onRenameClick={vi.fn()}
        onDeleteClick={vi.fn()}
      />,
    )

    expect(screen.getByTitle('Zoznam čaká na odoslanie')).toBeInTheDocument()
  })

  it('does not show a pending-sync badge once the selected list has synced', () => {
    render(
      <ListHeader
        listName="Groceries"
        pendingSync={false}
        onOpenSwitcher={vi.fn()}
        onOpenAllLists={vi.fn()}
        onRenameClick={vi.fn()}
        onDeleteClick={vi.fn()}
      />,
    )

    expect(
      screen.queryByTitle('Zoznam čaká na odoslanie'),
    ).not.toBeInTheDocument()
  })
})
