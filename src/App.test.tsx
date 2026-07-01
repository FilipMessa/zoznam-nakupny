import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'
import { useAuth } from './features/auth/useAuth'
import { useMembership } from './features/auth/useMembership'

vi.mock('./features/auth/useAuth', () => ({
  useAuth: vi.fn(),
}))
vi.mock('./features/auth/useMembership', () => ({
  useMembership: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)
const mockedUseMembership = vi.mocked(useMembership)

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
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders SignInScreen when there is no user', () => {
    mockedUseAuth.mockReturnValue({ user: null, authLoading: false })
    render(<App />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
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
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
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
    expect(screen.getByRole('textbox', { name: /invite code/i })).toBeInTheDocument()
  })

  it('renders MemberPlaceholder when membership status is member', () => {
    mockedUseAuth.mockReturnValue({
      user: { uid: 'uid-1' } as never,
      authLoading: false,
    })
    mockedUseMembership.mockReturnValue({
      status: 'member',
      markAsMember: vi.fn(),
    })
    render(<App />)
    expect(screen.getByText(/welcome|member/i)).toBeInTheDocument()
  })
})
