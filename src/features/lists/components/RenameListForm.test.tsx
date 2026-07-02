import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { RenameListForm } from './RenameListForm'

describe('RenameListForm', () => {
  it('prefills the input with the current list name', () => {
    render(
      <RenameListForm
        initialName="Groceries"
        onSubmit={vi.fn()}
        pending={false}
        error={null}
      />,
    )

    expect(screen.getByRole('textbox', { name: /list name/i })).toHaveValue(
      'Groceries',
    )
  })

  it('submits the trimmed, edited name', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(
      <RenameListForm
        initialName="Groceries"
        onSubmit={onSubmit}
        pending={false}
        error={null}
      />,
    )

    const input = screen.getByRole('textbox', { name: /list name/i })
    await user.clear(input)
    await user.type(input, '  Weekend shop  ')
    await user.click(screen.getByRole('button', { name: /save|rename/i }))

    expect(onSubmit).toHaveBeenCalledWith('Weekend shop')
  })

  it('disables submit when the name is cleared to empty', async () => {
    const user = userEvent.setup()
    render(
      <RenameListForm
        initialName="Groceries"
        onSubmit={vi.fn()}
        pending={false}
        error={null}
      />,
    )

    const input = screen.getByRole('textbox', { name: /list name/i })
    await user.clear(input)

    expect(screen.getByRole('button', { name: /save|rename/i })).toBeDisabled()
  })

  it('disables the form while pending', () => {
    render(
      <RenameListForm
        initialName="Groceries"
        onSubmit={vi.fn()}
        pending={true}
        error={null}
      />,
    )

    expect(screen.getByRole('button', { name: /save|rename/i })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: /list name/i })).toBeDisabled()
  })

  it('renders an error message when renaming fails', () => {
    render(
      <RenameListForm
        initialName="Groceries"
        onSubmit={vi.fn()}
        pending={false}
        error="unknown"
      />,
    )

    expect(
      screen.getByText(/something went wrong|try again/i),
    ).toBeInTheDocument()
  })
})
