import { describe, it, expect } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import { render, screen } from '@/test/render'
import { DraggedItemPreview } from './DraggedItemPreview'
import type { ShoppingItem } from '@/features/items/types'

function fakeTimestamp(millis: number): Timestamp {
  return { toMillis: () => millis } as unknown as Timestamp
}

function makeItem(overrides: Partial<ShoppingItem> = {}): ShoppingItem {
  return {
    id: 'item-1',
    text: 'mlieko',
    status: 'active',
    activeOrder: 1,
    completedAt: null,
    completedBy: null,
    createdAt: fakeTimestamp(0),
    createdBy: 'uid-1',
    updatedAt: fakeTimestamp(0),
    ...overrides,
  }
}

describe('DraggedItemPreview', () => {
  it('renders the item text', () => {
    render(<DraggedItemPreview item={makeItem({ text: 'chlieb' })} />)

    expect(screen.getByText('chlieb')).toBeInTheDocument()
  })

  it('renders no interactive controls (checkbox/buttons) -- it is display-only', () => {
    render(<DraggedItemPreview item={makeItem()} />)

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
