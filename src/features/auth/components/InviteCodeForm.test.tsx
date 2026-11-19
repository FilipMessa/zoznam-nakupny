import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/render'
import userEvent from '@testing-library/user-event'
import { InviteCodeForm } from './InviteCodeForm'

describe('InviteCodeForm', () => {
  it('disables submit until a code is entered', async () => {
    const onSubmit = vi.fn()
    render(<InviteCodeForm onSubmit={onSubmit} pending={false} error={null} />)

    expect(screen.getByRole('button', { name: /pripojiť/i })).toBeDisabled()

    const user = userEvent.setup()
    await user.type(
      screen.getByRole('textbox', { name: /pozývací kód/i }),
      'ABC123',
    )

    expect(screen.getByRole('button', { name: /pripojiť/i })).toBeEnabled()
  })

  it('calls onSubmit with the trimmed code value', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<InviteCodeForm onSubmit={onSubmit} pending={false} error={null} />)

    await user.type(
      screen.getByRole('textbox', { name: /pozývací kód/i }),
      '  ABC123  ',
    )
    await user.click(screen.getByRole('button', { name: /pripojiť/i }))

    expect(onSubmit).toHaveBeenCalledWith('ABC123')
  })

  it('shows a pending state and disables the form while submitting', () => {
    render(<InviteCodeForm onSubmit={vi.fn()} pending={true} error={null} />)

    expect(screen.getByRole('button', { name: /pripojiť/i })).toBeDisabled()
    expect(
      screen.getByRole('textbox', { name: /pozývací kód/i }),
    ).toBeDisabled()
  })

  it('renders an error message for an invalid code', async () => {
    render(
      <InviteCodeForm
        onSubmit={vi.fn()}
        pending={false}
        error="invalid-code"
      />,
    )

    await waitFor(() => {
      expect(screen.getByText(/neplatný/i)).toBeInTheDocument()
    })
  })

  it('renders a generic error message for unknown errors', () => {
    render(
      <InviteCodeForm onSubmit={vi.fn()} pending={false} error="unknown" />,
    )

    expect(
      screen.getByText(/niečo sa pokazilo|skúste to znova/i),
    ).toBeInTheDocument()
  })
})
