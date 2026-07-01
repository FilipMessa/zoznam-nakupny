import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListHeader } from './ListHeader'
import { signOutUser } from '../../auth/googleAuth'

vi.mock('../../auth/googleAuth', () => ({
  signOutUser: vi.fn(),
}))

const mockedSignOutUser = vi.mocked(signOutUser)

describe('ListHeader', () => {
  beforeEach(() => {
    mockedSignOutUser.mockReset()
    mockedSignOutUser.mockResolvedValue(undefined)
  })

  it('renders the list name', () => {
    render(
      <ListHeader
        listName="Groceries"
        onOpenSwitcher={vi.fn()}
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
        onRenameClick={vi.fn()}
        onDeleteClick={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /prepnúť zoznam/i }))

    expect(onOpenSwitcher).toHaveBeenCalledTimes(1)
  })

  it('calls onRenameClick when the rename button is clicked', async () => {
    const onRenameClick = vi.fn()
    const user = userEvent.setup()
    render(
      <ListHeader
        listName="Groceries"
        onOpenSwitcher={vi.fn()}
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
        onRenameClick={vi.fn()}
        onDeleteClick={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /prepnúť zoznam/i })).toHaveClass(
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
})
