import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteListConfirmDialog } from './DeleteListConfirmDialog'

// This dialog is an in-app, Testing-Library-testable confirm (NOT
// window.confirm), so it must require an explicit confirm click before the
// delete callback fires — clicking cancel/outside must not call it.
describe('DeleteListConfirmDialog', () => {
  it('renders nothing (or is hidden) when not open', () => {
    render(
      <DeleteListConfirmDialog
        open={false}
        listName="Groceries"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the list name and asks for confirmation when open', () => {
    render(
      <DeleteListConfirmDialog
        open={true}
        listName="Groceries"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/groceries/i)).toBeInTheDocument()
  })

  it('does not call onConfirm just by rendering or opening', () => {
    const onConfirm = vi.fn()
    render(
      <DeleteListConfirmDialog
        open={true}
        listName="Groceries"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    )

    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('calls onConfirm only after the explicit confirm button is clicked', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()
    render(
      <DeleteListConfirmDialog
        open={true}
        listName="Groceries"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel and not onConfirm when cancel is clicked', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(
      <DeleteListConfirmDialog
        open={true}
        listName="Groceries"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
