import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignInScreen } from './SignInScreen'
import { signInWithGoogle } from '../googleAuth'

vi.mock('../googleAuth', () => ({
  signInWithGoogle: vi.fn(),
}))

const mockedSignIn = vi.mocked(signInWithGoogle)

describe('SignInScreen', () => {
  beforeEach(() => {
    mockedSignIn.mockReset()
  })

  it('renders a sign-in button', () => {
    render(<SignInScreen />)
    expect(
      screen.getByRole('button', { name: /sign in/i }),
    ).toBeInTheDocument()
  })

  it('calls signInWithGoogle when the button is clicked', async () => {
    mockedSignIn.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<SignInScreen />)

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockedSignIn).toHaveBeenCalledTimes(1)
  })

  it.each(['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/popup-blocked'])(
    'shows an inline retry message on non-fatal popup error %s, without throwing',
    async (code) => {
      mockedSignIn.mockRejectedValueOnce({ code })
      const user = userEvent.setup()
      render(<SignInScreen />)

      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/try again/i)).toBeInTheDocument()
      })
      expect(
        screen.getByRole('button', { name: /sign in/i }),
      ).toBeInTheDocument()
    },
  )
})
