import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from './test/render'
import userEvent from '@testing-library/user-event'
import App from './App'
import { useAuth } from './features/auth/useAuth'
import { useMembership } from './features/auth/useMembership'
import { useLists } from './features/lists/useLists'
import { useSelectedListId } from './features/lists/useSelectedListId'

vi.mock('./features/auth/useAuth', () => ({
  useAuth: vi.fn(),
}))
vi.mock('./features/auth/useMembership', () => ({
  useMembership: vi.fn(),
}))
vi.mock('./features/lists/useLists', () => ({
  useLists: vi.fn(),
}))
vi.mock('./features/lists/useSelectedListId', () => ({
  useSelectedListId: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)
const mockedUseMembership = vi.mocked(useMembership)
const mockedUseLists = vi.mocked(useLists)
const mockedUseSelectedListId = vi.mocked(useSelectedListId)

describe('App state machine', () => {
  beforeEach(() => {
    mockedUseMembership.mockReturnValue({
      status: 'idle',
      markAsMember: vi.fn(),
    })
  })

  it('renders LoadingScreen while auth is loading', () => {
    mockedUseAuth.mockReturnValue({ user: null, authLoading: true })
    render(<App />)
    expect(screen.getByText(/načítava/i)).toBeInTheDocument()
  })

  it('renders SignInScreen when there is no user', () => {
    mockedUseAuth.mockReturnValue({ user: null, authLoading: false })
    render(<App />)
    expect(
      screen.getByRole('button', { name: /prihlásiť/i }),
    ).toBeInTheDocument()
  })

  it.each(['idle', 'loading'] as const)(
    'renders LoadingScreen while membership status is %s',
    (status) => {
      mockedUseAuth.mockReturnValue({
        user: { uid: 'uid-1' } as never,
        authLoading: false,
      })
      mockedUseMembership.mockReturnValue({ status, markAsMember: vi.fn() })
      render(<App />)
      expect(screen.getByText(/načítava/i)).toBeInTheDocument()
    },
  )

  it('renders InviteCodeScreen when membership status is non-member', () => {
    mockedUseAuth.mockReturnValue({
      user: { uid: 'uid-1' } as never,
      authLoading: false,
    })
    mockedUseMembership.mockReturnValue({
      status: 'non-member',
      markAsMember: vi.fn(),
    })
    render(<App />)
    expect(
      screen.getByRole('textbox', { name: /pozývací kód/i }),
    ).toBeInTheDocument()
  })

  it('renders ListsScreen when membership status is member', () => {
    mockedUseAuth.mockReturnValue({
      user: { uid: 'uid-1' } as never,
      authLoading: false,
    })
    mockedUseMembership.mockReturnValue({
      status: 'member',
      markAsMember: vi.fn(),
    })
    mockedUseLists.mockReturnValue({ lists: [], listsLoading: false })
    mockedUseSelectedListId.mockReturnValue({
      selectedListId: null,
      selectList: vi.fn(),
    })
    render(<App />)
    expect(screen.getByText(/vytvorte.*prvý zoznam/i)).toBeInTheDocument()
  })

  it('lets a member close the create-list modal from the empty state', async () => {
    mockedUseAuth.mockReturnValue({
      user: { uid: 'uid-1' } as never,
      authLoading: false,
    })
    mockedUseMembership.mockReturnValue({
      status: 'member',
      markAsMember: vi.fn(),
    })
    mockedUseLists.mockReturnValue({ lists: [], listsLoading: false })
    mockedUseSelectedListId.mockReturnValue({
      selectedListId: null,
      selectList: vi.fn(),
    })
    const user = userEvent.setup()

    render(<App />)
    await user.click(screen.getByRole('button', { name: /vytvoriť zoznam/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /zatvoriť/i }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText(/vytvorte.*prvý zoznam/i)).toBeInTheDocument()
  })
})
