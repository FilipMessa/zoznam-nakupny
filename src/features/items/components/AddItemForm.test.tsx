import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { AddItemForm } from './AddItemForm'

// Mirrors CreateListForm's test conventions (src/features/lists/components/CreateListForm.test.tsx):
// disabled while pending, calls the submit callback with the trimmed
// value, clears the input on success, and surfaces an error message.
describe('AddItemForm', () => {
  it('focuses the input instead of submitting when text is empty', async () => {
    const onSubmit = vi.fn()
    render(<AddItemForm onSubmit={onSubmit} pending={false} error={null} />)

    const button = screen.getByRole('button', { name: /pridať/i })
    expect(button).toBeEnabled()

    const user = userEvent.setup()
    await user.click(button)

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: /položka/i })).toHaveFocus()
  })

  it('calls onSubmit with the trimmed item text', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<AddItemForm onSubmit={onSubmit} pending={false} error={null} />)

    await user.type(
      screen.getByRole('textbox', { name: /položka/i }),
      '  mlieko  ',
    )
    await user.click(screen.getByRole('button', { name: /pridať/i }))

    expect(onSubmit).toHaveBeenCalledWith('mlieko')
  })

  it('clears the input after a successful submit', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <AddItemForm onSubmit={onSubmit} pending={false} error={null} />,
    )

    const input = screen.getByRole('textbox', { name: /položka/i })
    await user.type(input, 'mlieko')
    await user.click(screen.getByRole('button', { name: /pridať/i }))

    // Simulate the parent flipping pending true->false after a successful
    // add, the same lifecycle CreateListForm relies on to observe a cleared
    // controlled input.
    rerender(<AddItemForm onSubmit={onSubmit} pending={true} error={null} />)
    rerender(<AddItemForm onSubmit={onSubmit} pending={false} error={null} />)

    expect(
      screen.getByRole('textbox', { name: /položka/i }),
    ).toHaveValue('')
  })

  it('disables the form while pending', () => {
    render(<AddItemForm onSubmit={vi.fn()} pending={true} error={null} />)

    expect(screen.getByRole('button', { name: /pridať/i })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: /položka/i })).toBeDisabled()
  })

  it('shows an error message when adding fails', async () => {
    render(<AddItemForm onSubmit={vi.fn()} pending={false} error="unknown" />)

    await waitFor(() => {
      expect(
        screen.getByText(/niečo sa pokazilo|skúste to znova/i),
      ).toBeInTheDocument()
    })
  })
})
