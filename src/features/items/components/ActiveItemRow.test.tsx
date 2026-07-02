import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../test/render'
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
    render(<ActiveItemRow item={makeActiveItem({ text: 'mlieko' })} onCheck={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('mlieko')).toBeInTheDocument()
  })

  it('renders an unchecked checkbox', () => {
    render(<ActiveItemRow item={makeActiveItem()} onCheck={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('calls onCheck with the item id when the checkbox is clicked', async () => {
    const onCheck = vi.fn()
    const user = userEvent.setup()
    render(
      <ActiveItemRow
        item={makeActiveItem({ id: 'item-42' })}
        onCheck={onCheck}
        onDelete={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('checkbox'))

    expect(onCheck).toHaveBeenCalledWith('item-42')
  })

  it('calls onDelete with the item id when the delete button is clicked', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()
    const { container } = render(
      <ActiveItemRow
        item={makeActiveItem({ id: 'item-9' })}
        onCheck={vi.fn()}
        onDelete={onDelete}
      />,
    )

    await user.click(
      container.querySelector<HTMLButtonElement>('button.icon-btn')!,
    )

    expect(onDelete).toHaveBeenCalledWith('item-9')
  })

  it('makes the whole item row the sortable drag activator', () => {
    render(<ActiveItemRow item={makeActiveItem()} onCheck={vi.fn()} onDelete={vi.fn()} />)

    expect(
      screen.getByTestId('active-item-content-item-1'),
    ).toHaveAttribute('aria-roledescription', 'sortable')
    expect(
      screen.queryByRole('button', { name: /presunúť/i }),
    ).not.toBeInTheDocument()
  })

  it('reveals the delete action on a horizontal touch swipe', () => {
    const { container } = render(
      <ActiveItemRow item={makeActiveItem({ id: 'item-1' })} onCheck={vi.fn()} onDelete={vi.fn()} />,
    )

    const content = screen.getByTestId('active-item-content-item-1')
    content.setPointerCapture = vi.fn()

    fireEvent.pointerDown(content, { pointerType: 'touch', clientX: 200, clientY: 100 })
    fireEvent.pointerMove(content, { pointerType: 'touch', clientX: 150, clientY: 102 })
    fireEvent.pointerMove(content, { pointerType: 'touch', clientX: 100, clientY: 103 })
    fireEvent.pointerUp(content, { pointerType: 'touch', clientX: 100, clientY: 103 })

    const revealButton = container.querySelector('button[aria-label="Vymazať položku"]')
    expect(revealButton).toHaveAttribute('aria-hidden', 'false')
  })

  it('deletes the item when the revealed swipe action is tapped', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()
    const { container } = render(
      <ActiveItemRow
        item={makeActiveItem({ id: 'item-1' })}
        onCheck={vi.fn()}
        onDelete={onDelete}
      />,
    )

    const content = screen.getByTestId('active-item-content-item-1')
    content.setPointerCapture = vi.fn()

    fireEvent.pointerDown(content, { pointerType: 'touch', clientX: 200, clientY: 100 })
    fireEvent.pointerMove(content, { pointerType: 'touch', clientX: 150, clientY: 102 })
    fireEvent.pointerMove(content, { pointerType: 'touch', clientX: 100, clientY: 103 })
    fireEvent.pointerUp(content, { pointerType: 'touch', clientX: 100, clientY: 103 })

    const revealButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Vymazať položku"]',
    )!
    await user.click(revealButton)

    expect(onDelete).toHaveBeenCalledWith('item-1')
  })

  it('does not reveal the delete action on a vertical touch drag (reorder gesture)', () => {
    const { container } = render(
      <ActiveItemRow item={makeActiveItem({ id: 'item-1' })} onCheck={vi.fn()} onDelete={vi.fn()} />,
    )

    const content = screen.getByTestId('active-item-content-item-1')
    content.setPointerCapture = vi.fn()

    fireEvent.pointerDown(content, { pointerType: 'touch', clientX: 200, clientY: 100 })
    fireEvent.pointerMove(content, { pointerType: 'touch', clientX: 202, clientY: 150 })
    fireEvent.pointerMove(content, { pointerType: 'touch', clientX: 203, clientY: 200 })
    fireEvent.pointerUp(content, { pointerType: 'touch', clientX: 203, clientY: 200 })

    const revealButton = container.querySelector('button[aria-label="Vymazať položku"]')
    expect(revealButton).toHaveAttribute('aria-hidden', 'true')
  })

  it('does not swipe for mouse pointer input, leaving mouse drag activation untouched', () => {
    const { container } = render(
      <ActiveItemRow item={makeActiveItem({ id: 'item-1' })} onCheck={vi.fn()} onDelete={vi.fn()} />,
    )

    const content = screen.getByTestId('active-item-content-item-1')

    fireEvent.pointerDown(content, { pointerType: 'mouse', clientX: 200, clientY: 100 })
    fireEvent.pointerMove(content, { pointerType: 'mouse', clientX: 100, clientY: 100 })
    fireEvent.pointerUp(content, { pointerType: 'mouse', clientX: 100, clientY: 100 })

    const revealButton = container.querySelector('button[aria-label="Vymazať položku"]')
    expect(revealButton).toHaveAttribute('aria-hidden', 'true')
  })
})
