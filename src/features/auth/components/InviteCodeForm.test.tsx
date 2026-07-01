import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InviteCodeForm } from './InviteCodeForm'

describe('InviteCodeForm', () => {
  it('disables submit until a code is entered', async () => {
    const onSubmit = vi.fn()
    render(<InviteCodeForm onSubmit={onSubmit} pending={false} error={null} />)

    expect(screen.getByRole('button', { name: /join/i })).toBeDisabled()

    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: /invite code/i }), 'ABC123')

    expect(screen.getByRole('button', { name: /join/i })).toBeEnabled()
  })

  it('calls onSubmit with the trimmed code value', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<InviteCodeForm onSubmit={onSubmit} pending={false} error={null} />)

    await user.type(screen.getByRole('textbox', { name: /invite code/i }), '  ABC123  ')
    await user.click(screen.getByRole('button', { name: /join/i }))

    expect(onSubmit).toHaveBeenCalledWith('ABC123')
  })

  it('shows a pending state and disables the form while submitting', () => {
    render(<InviteCodeForm onSubmit={vi.fn()} pending={true} error={null} />)

    expect(screen.getByRole('button', { name: /join/i })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: /invite code/i })).toBeDisabled()
  })

  it('renders an error message for an invalid code', async () => {
    render(
      <InviteCodeForm onSubmit={vi.fn()} pending={false} error="invalid-code" />,
    )

    await waitFor(() => {
      expect(screen.getByText(/invalid/i)).toBeInTheDocument()
    })
  })

  it('renders a generic error message for unknown errors', () => {
    render(<InviteCodeForm onSubmit={vi.fn()} pending={false} error="unknown" />)

    expect(screen.getByText(/something went wrong|try again/i)).toBeInTheDocument()
  })
})
