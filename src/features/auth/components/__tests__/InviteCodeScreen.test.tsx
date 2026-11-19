import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/render'
import userEvent from '@testing-library/user-event'
import { InviteCodeScreen } from '@/features/auth/components/InviteCodeScreen'
import { redeemInviteCode } from '@/features/auth/inviteApi'
import { useAuth } from '@/features/auth/useAuth'

vi.mock('@/features/auth/inviteApi', () => ({
  redeemInviteCode: vi.fn(),
}))
vi.mock('@/features/auth/useAuth', () => ({
  useAuth: vi.fn(),
}))

const mockedRedeem = vi.mocked(redeemInviteCode)
const mockedUseAuth = vi.mocked(useAuth)

describe('InviteCodeScreen', () => {
  const markAsMember = vi.fn()

  beforeEach(() => {
    mockedRedeem.mockReset()
    markAsMember.mockReset()
    mockedUseAuth.mockReturnValue({
      user: { uid: 'uid-1' } as never,
      authLoading: false,
    })
  })

  it('redeems a valid code and calls markAsMember on success', async () => {
    mockedRedeem.mockResolvedValueOnce({ ok: true })
    const user = userEvent.setup()
    render(<InviteCodeScreen markAsMember={markAsMember} />)

    await user.type(
      screen.getByRole('textbox', { name: /pozývací kód/i }),
      'ABC123',
    )
    await user.click(screen.getByRole('button', { name: /pripojiť/i }))

    await waitFor(() => {
      expect(mockedRedeem).toHaveBeenCalledWith('uid-1', 'ABC123')
      expect(markAsMember).toHaveBeenCalledTimes(1)
    })
  })

  it('shows an invalid-code error and does not call markAsMember', async () => {
    mockedRedeem.mockResolvedValueOnce({ ok: false, error: 'invalid-code' })
    const user = userEvent.setup()
    render(<InviteCodeScreen markAsMember={markAsMember} />)

    await user.type(
      screen.getByRole('textbox', { name: /pozývací kód/i }),
      'BADCODE',
    )
    await user.click(screen.getByRole('button', { name: /pripojiť/i }))

    await waitFor(() => {
      expect(screen.getByText(/neplatný/i)).toBeInTheDocument()
    })
    expect(markAsMember).not.toHaveBeenCalled()
  })

  it('disables the form while the redemption is pending', async () => {
    let resolveRedeem: (value: { ok: true }) => void = () => {}
    mockedRedeem.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRedeem = resolve
        }),
    )
    const user = userEvent.setup()
    render(<InviteCodeScreen markAsMember={markAsMember} />)

    await user.type(
      screen.getByRole('textbox', { name: /pozývací kód/i }),
      'ABC123',
    )
    await user.click(screen.getByRole('button', { name: /pripojiť/i }))

    expect(screen.getByRole('button', { name: /pripojiť/i })).toBeDisabled()

    resolveRedeem({ ok: true })
    await waitFor(() => expect(markAsMember).toHaveBeenCalled())
  })
})
