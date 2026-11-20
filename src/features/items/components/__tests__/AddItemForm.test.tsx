import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/render'
import userEvent from '@testing-library/user-event'
import { AddItemForm } from '@/features/items/components/AddItemForm'

const noSuggestions = () => []

// Calls the submit callback with the trimmed value, clears the input
// immediately on submit, keeps focus in the input after tapping the submit
// button (rapid multi-item entry), and surfaces an error message.
describe('AddItemForm', () => {
  it('focuses the input instead of submitting when text is empty', async () => {
    const onSubmit = vi.fn()
    render(
      <AddItemForm suggest={noSuggestions} onSubmit={onSubmit} error={null} />,
    )

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
    render(
      <AddItemForm suggest={noSuggestions} onSubmit={onSubmit} error={null} />,
    )

    await user.type(
      screen.getByRole('textbox', { name: /položka/i }),
      '  mlieko  ',
    )
    await user.click(screen.getByRole('button', { name: /pridať/i }))

    expect(onSubmit).toHaveBeenCalledWith('mlieko')
  })

  it('clears the input immediately after submitting', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(
      <AddItemForm suggest={noSuggestions} onSubmit={onSubmit} error={null} />,
    )

    const input = screen.getByRole('textbox', { name: /položka/i })
    await user.type(input, 'mlieko')
    await user.click(screen.getByRole('button', { name: /pridať/i }))

    expect(input).toHaveValue('')
  })

  it('keeps the input focused after tapping the submit button', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(
      <AddItemForm suggest={noSuggestions} onSubmit={onSubmit} error={null} />,
    )

    const input = screen.getByRole('textbox', { name: /položka/i })
    await user.type(input, 'mlieko')
    await user.click(screen.getByRole('button', { name: /pridať/i }))

    expect(input).toHaveFocus()
  })

  it('shows an error message when adding fails', async () => {
    render(
      <AddItemForm
        suggest={noSuggestions}
        onSubmit={vi.fn()}
        error="unknown"
      />,
    )

    await waitFor(() => {
      expect(
        screen.getByText(/niečo sa pokazilo|skúste to znova/i),
      ).toBeInTheDocument()
    })
  })
})
