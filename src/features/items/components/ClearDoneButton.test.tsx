import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClearDoneButton } from './ClearDoneButton'

// Explicit behavior choice (per PLAN.md: "single click, no confirm dialog
// needed -- non-destructive-feeling, small item counts"): the button is
// simply disabled when there is nothing to clear, rather than hidden, so
// the done section's layout doesn't shift as items are checked/unchecked.
describe('ClearDoneButton', () => {
  it('is disabled when there are no done items', () => {
    render(<ClearDoneButton doneCount={0} onClear={vi.fn()} />)

    expect(screen.getByRole('button', { name: /vymazať/i })).toBeDisabled()
  })

  it('is enabled when there is at least one done item', () => {
    render(<ClearDoneButton doneCount={3} onClear={vi.fn()} />)

    expect(screen.getByRole('button', { name: /vymazať/i })).toBeEnabled()
  })

  it('calls onClear when clicked, with no confirmation step', async () => {
    const onClear = vi.fn()
    const user = userEvent.setup()
    render(<ClearDoneButton doneCount={2} onClear={onClear} />)

    await user.click(screen.getByRole('button', { name: /vymazať/i }))

    expect(onClear).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
