import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { ActiveItemRow } from './ActiveItemRow'
import type { ShoppingItem } from '../types'

function makeActiveItem(overrides: Partial<ShoppingItem> = {}): ShoppingItem {
  return {
    id: 'item-1',
    text: 'mlieko',
    status: 'active',
    activeOrder: 1,
    completedAt: null,
    completedBy: null,
    createdAt: null as unknown as ShoppingItem['createdAt'],
    createdBy: 'uid-1',
    updatedAt: null as unknown as ShoppingItem['updatedAt'],
    ...overrides,
  }
}

describe('ActiveItemRow', () => {
  it('renders the item text', () => {
    render(<ActiveItemRow item={makeActiveItem({ text: 'mlieko' })} onCheck={vi.fn()} />)

    expect(screen.getByText('mlieko')).toBeInTheDocument()
  })

  it('renders an unchecked checkbox', () => {
    render(<ActiveItemRow item={makeActiveItem()} onCheck={vi.fn()} />)

    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('calls onCheck with the item id when the checkbox is clicked', async () => {
    const onCheck = vi.fn()
    const user = userEvent.setup()
    render(
      <ActiveItemRow item={makeActiveItem({ id: 'item-42' })} onCheck={onCheck} />,
    )

    await user.click(screen.getByRole('checkbox'))

    expect(onCheck).toHaveBeenCalledWith('item-42')
  })

  // Touch-target polish (Phase 7): icon-only actions must be at least 44px
  // tappable, enforced via the shared `.icon-btn` class (min-width/min-height
  // set from --touch-target in CSS). We assert the class hook only, since
  // jsdom cannot reliably resolve CSS custom properties into computed pixels.
  it('applies the icon-btn touch-target class to the drag handle', () => {
    render(<ActiveItemRow item={makeActiveItem()} onCheck={vi.fn()} />)

    expect(
      screen.getByRole('button', { name: /presunúť/i }),
    ).toHaveClass('icon-btn')
  })
})
