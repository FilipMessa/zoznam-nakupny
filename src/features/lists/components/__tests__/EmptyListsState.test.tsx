import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/render'
import userEvent from '@testing-library/user-event'
import { EmptyListsState } from '@/features/lists/components/EmptyListsState'

describe('EmptyListsState', () => {
  it('shows copy inviting the user to create their first list', () => {
    render(<EmptyListsState onCreateClick={vi.fn()} />)

    expect(screen.getByText(/vytvorte.*prvý zoznam/i)).toBeInTheDocument()
  })

  it('calls onCreateClick when the CTA is clicked', async () => {
    const onCreateClick = vi.fn()
    const user = userEvent.setup()
    render(<EmptyListsState onCreateClick={onCreateClick} />)

    await user.click(screen.getByRole('button', { name: /vytvoriť zoznam/i }))

    expect(onCreateClick).toHaveBeenCalledTimes(1)
  })
})
