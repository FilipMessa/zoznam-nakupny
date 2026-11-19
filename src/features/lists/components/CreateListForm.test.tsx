import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { CreateListForm } from './CreateListForm'

// Mirrors the InviteCodeForm test conventions (src/features/auth/components/InviteCodeForm.test.tsx):
// disabled while empty/pending, calls the submit callback with the trimmed
// value, and surfaces an error message.
describe('CreateListForm', () => {
  it('disables submit until a name is entered', async () => {
    const onSubmit = vi.fn()
    render(
      <CreateListForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        pending={false}
        error={null}
      />,
    )

    expect(screen.getByRole('button', { name: /vytvoriť/i })).toBeDisabled()

    const user = userEvent.setup()
    await user.type(
      screen.getByRole('textbox', { name: /názov zoznamu/i }),
      'Groceries',
    )

    expect(screen.getByRole('button', { name: /vytvoriť/i })).toBeEnabled()
  })

  it('calls onSubmit with the trimmed list name', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(
      <CreateListForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        pending={false}
        error={null}
      />,
    )

    await user.type(
      screen.getByRole('textbox', { name: /názov zoznamu/i }),
      '  Groceries  ',
    )
    await user.click(screen.getByRole('button', { name: /vytvoriť/i }))

    expect(onSubmit).toHaveBeenCalledWith('Groceries')
  })

  it('shows a pending state and disables the form while submitting', () => {
    render(
      <CreateListForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        pending={true}
        error={null}
      />,
    )

    expect(screen.getByRole('button', { name: /vytvoriť/i })).toBeDisabled()
    expect(
      screen.getByRole('textbox', { name: /názov zoznamu/i }),
    ).toBeDisabled()
  })

  it('renders an error message when creation fails', async () => {
    render(
      <CreateListForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        pending={false}
        error="unknown"
      />,
    )

    await waitFor(() => {
      expect(
        screen.getByText(/niečo sa pokazilo|skúste to znova/i),
      ).toBeInTheDocument()
    })
  })

  it('keeps dialog semantics for assistive tech', () => {
    render(
      <CreateListForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        pending={false}
        error={null}
      />,
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('calls onCancel when the close button is clicked', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(
      <CreateListForm
        onSubmit={vi.fn()}
        onCancel={onCancel}
        pending={false}
        error={null}
      />,
    )

    await user.click(screen.getByRole('button', { name: /zatvoriť/i }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when the backdrop is clicked', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(
      <CreateListForm
        onSubmit={vi.fn()}
        onCancel={onCancel}
        pending={false}
        error={null}
      />,
    )

    await user.click(screen.getByTestId('create-list-backdrop'))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('does not call onCancel when the form content is clicked', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(
      <CreateListForm
        onSubmit={vi.fn()}
        onCancel={onCancel}
        pending={false}
        error={null}
      />,
    )

    await user.click(screen.getByRole('textbox', { name: /názov zoznamu/i }))

    expect(onCancel).not.toHaveBeenCalled()
  })
})
