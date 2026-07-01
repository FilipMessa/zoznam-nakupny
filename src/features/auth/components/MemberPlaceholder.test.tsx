import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemberPlaceholder } from './MemberPlaceholder'
import { signOutUser } from '../googleAuth'

vi.mock('../googleAuth', () => ({
  signOutUser: vi.fn(),
}))

const mockedSignOut = vi.mocked(signOutUser)

describe('MemberPlaceholder', () => {
  beforeEach(() => {
    mockedSignOut.mockReset()
  })

  it('renders a placeholder for signed-in members', () => {
    render(<MemberPlaceholder />)
    expect(screen.getByText(/welcome|member/i)).toBeInTheDocument()
  })

  it('calls signOutUser when the sign-out button is clicked', async () => {
    mockedSignOut.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<MemberPlaceholder />)

    await user.click(screen.getByRole('button', { name: /sign out/i }))

    expect(mockedSignOut).toHaveBeenCalledTimes(1)
  })
})
