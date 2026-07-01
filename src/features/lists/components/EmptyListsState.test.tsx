import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyListsState } from './EmptyListsState'

describe('EmptyListsState', () => {
  it('shows copy inviting the user to create their first list', () => {
    render(<EmptyListsState onCreateClick={vi.fn()} />)

    expect(screen.getByText(/create your first list/i)).toBeInTheDocument()
  })

  it('calls onCreateClick when the CTA is clicked', async () => {
    const onCreateClick = vi.fn()
    const user = userEvent.setup()
    render(<EmptyListsState onCreateClick={onCreateClick} />)

    await user.click(
      screen.getByRole('button', { name: /create.*list/i }),
    )

    expect(onCreateClick).toHaveBeenCalledTimes(1)
  })
})
