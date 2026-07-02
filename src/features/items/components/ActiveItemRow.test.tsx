import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { ActiveItemRow, type ActiveItemRowProps } from './ActiveItemRow'
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

function makeProps(
  overrides: Partial<ActiveItemRowProps> = {},
): ActiveItemRowProps {
  return {
    item: makeActiveItem(),
    onCheck: vi.fn(),
    onDelete: vi.fn(),
    isEditing: false,
    onStartEdit: vi.fn(),
    onSubmitEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    // Matches the real app's initial state (ShoppingListScreen's
    // openSwipeItemId starts null, so every row's isSwipeOpen starts
    // false) -- a mocked onSwipeOpenChange won't flip this to true the way
    // the real parent would, so tests below rely on the row's own gesture
    // being enough to open and stay open without external confirmation.
    isSwipeOpen: false,
    onSwipeOpenChange: vi.fn(),
    ...overrides,
  }
}

describe('ActiveItemRow', () => {
  it('renders the item text', () => {
    render(<ActiveItemRow {...makeProps({ item: makeActiveItem({ text: 'mlieko' }) })} />)

    expect(screen.getByText('mlieko')).toBeInTheDocument()
  })

  it('renders an unchecked checkbox', () => {
    render(<ActiveItemRow {...makeProps()} />)

    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('gives the checkbox an accessible name from the item text', () => {
    // Regression test: the item text used to be wrapped in Checkbox.Label
    // (giving the checkbox its accessible name via that association) until
    // it was pulled out to a plain sibling <Text> so tapping the text
    // wouldn't also toggle the checkbox -- that also silently dropped the
    // checkbox's accessible name unless it's set explicitly.
    render(<ActiveItemRow {...makeProps({ item: makeActiveItem({ text: 'mlieko' }) })} />)

    expect(screen.getByRole('checkbox', { name: 'mlieko' })).toBeInTheDocument()
  })

  it('does not toggle the checkbox when the item text is clicked', async () => {
    const onCheck = vi.fn()
    const user = userEvent.setup()
    render(<ActiveItemRow {...makeProps({ item: makeActiveItem({ text: 'mlieko' }), onCheck })} />)

    await user.click(screen.getByText('mlieko'))

    expect(onCheck).not.toHaveBeenCalled()
  })

  it('calls onCheck with the item id when the checkbox is clicked', async () => {
    const onCheck = vi.fn()
    const user = userEvent.setup()
    render(
      <ActiveItemRow
        {...makeProps({ item: makeActiveItem({ id: 'item-42' }), onCheck })}
      />,
    )

    await user.click(screen.getByRole('checkbox'))

    expect(onCheck).toHaveBeenCalledWith('item-42')
  })

  it('calls onDelete with the item id when the desktop delete button is clicked', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()
    const { container } = render(
      <ActiveItemRow
        {...makeProps({ item: makeActiveItem({ id: 'item-9' }), onDelete })}
      />,
    )

    // The desktop icon buttons are `display: none` below the `md`
    // breakpoint, which jsdom's default (zero-width) viewport matches, so
    // they're excluded from the accessibility tree -- query by attribute
    // instead of role, same as the existing swipe-reveal button tests do.
    await user.click(
      container.querySelector<HTMLButtonElement>('button[aria-label="Zmazať"]')!,
    )

    expect(onDelete).toHaveBeenCalledWith('item-9')
  })

  it('calls onStartEdit with the item id when the desktop edit button is clicked', async () => {
    const onStartEdit = vi.fn()
    const user = userEvent.setup()
    const { container } = render(
      <ActiveItemRow
        {...makeProps({ item: makeActiveItem({ id: 'item-9' }), onStartEdit })}
      />,
    )

    await user.click(
      container.querySelector<HTMLButtonElement>('button[aria-label="Upraviť"]')!,
    )

    expect(onStartEdit).toHaveBeenCalledWith('item-9')
  })

  it('makes the whole item row the sortable drag activator', () => {
    render(<ActiveItemRow {...makeProps()} />)

    expect(
      screen.getByTestId('active-item-content-item-1'),
    ).toHaveAttribute('aria-roledescription', 'sortable')
    expect(
      screen.queryByRole('button', { name: /presunúť/i }),
    ).not.toBeInTheDocument()
  })

  it('reveals both the edit and delete actions on a horizontal touch swipe', () => {
    const { container } = render(<ActiveItemRow {...makeProps()} />)

    const content = screen.getByTestId('active-item-content-item-1')
    content.setPointerCapture = vi.fn()

    fireEvent.pointerDown(content, { pointerType: 'touch', clientX: 200, clientY: 100 })
    fireEvent.pointerMove(content, { pointerType: 'touch', clientX: 150, clientY: 102 })
    fireEvent.pointerMove(content, { pointerType: 'touch', clientX: 50, clientY: 103 })
    fireEvent.pointerUp(content, { pointerType: 'touch', clientX: 50, clientY: 103 })

    expect(
      container.querySelector('button[aria-label="Vymazať položku"]'),
    ).toHaveAttribute('aria-hidden', 'false')
    expect(
      container.querySelector('button[aria-label="Upraviť položku"]'),
    ).toHaveAttribute('aria-hidden', 'false')
  })

  it('deletes the item when the revealed swipe delete action is tapped', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()
    const { container } = render(
      <ActiveItemRow {...makeProps({ item: makeActiveItem({ id: 'item-1' }), onDelete })} />,
    )

    const content = screen.getByTestId('active-item-content-item-1')
    content.setPointerCapture = vi.fn()

    fireEvent.pointerDown(content, { pointerType: 'touch', clientX: 200, clientY: 100 })
    fireEvent.pointerMove(content, { pointerType: 'touch', clientX: 150, clientY: 102 })
    fireEvent.pointerMove(content, { pointerType: 'touch', clientX: 50, clientY: 103 })
    fireEvent.pointerUp(content, { pointerType: 'touch', clientX: 50, clientY: 103 })

    const revealButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Vymazať položku"]',
    )!
    await user.click(revealButton)

    expect(onDelete).toHaveBeenCalledWith('item-1')
  })

  it('starts editing when the revealed swipe edit action is tapped', async () => {
    const onStartEdit = vi.fn()
    const user = userEvent.setup()
    const { container } = render(
      <ActiveItemRow {...makeProps({ item: makeActiveItem({ id: 'item-1' }), onStartEdit })} />,
    )

    const content = screen.getByTestId('active-item-content-item-1')
    content.setPointerCapture = vi.fn()

    fireEvent.pointerDown(content, { pointerType: 'touch', clientX: 200, clientY: 100 })
    fireEvent.pointerMove(content, { pointerType: 'touch', clientX: 150, clientY: 102 })
    fireEvent.pointerMove(content, { pointerType: 'touch', clientX: 50, clientY: 103 })
    fireEvent.pointerUp(content, { pointerType: 'touch', clientX: 50, clientY: 103 })

    const revealButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Upraviť položku"]',
    )!
    await user.click(revealButton)

    expect(onStartEdit).toHaveBeenCalledWith('item-1')
  })

  it('does not reveal actions on a vertical touch drag (reorder gesture)', () => {
    const { container } = render(
      <ActiveItemRow {...makeProps({ item: makeActiveItem({ id: 'item-1' }) })} />,
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
      <ActiveItemRow {...makeProps({ item: makeActiveItem({ id: 'item-1' }) })} />,
    )

    const content = screen.getByTestId('active-item-content-item-1')

    fireEvent.pointerDown(content, { pointerType: 'mouse', clientX: 200, clientY: 100 })
    fireEvent.pointerMove(content, { pointerType: 'mouse', clientX: 100, clientY: 100 })
    fireEvent.pointerUp(content, { pointerType: 'mouse', clientX: 100, clientY: 100 })

    const revealButton = container.querySelector('button[aria-label="Vymazať položku"]')
    expect(revealButton).toHaveAttribute('aria-hidden', 'true')
  })

  it('opens on its own gesture before the parent has confirmed it as the exclusive open row', () => {
    // Regression test: isSwipeOpen starts false (the real app's initial
    // state -- see makeProps above). A swipe gesture must still open the
    // row immediately; it must not require the parent to have already set
    // isSwipeOpen=true, since that only happens *after* this row tells the
    // parent it opened (a round trip that can't complete before the user's
    // own gesture finishes).
    const { container } = render(<ActiveItemRow {...makeProps({ isSwipeOpen: false })} />)

    const content = screen.getByTestId('active-item-content-item-1')
    content.setPointerCapture = vi.fn()

    fireEvent.pointerDown(content, { pointerType: 'touch', clientX: 200, clientY: 100 })
    fireEvent.pointerMove(content, { pointerType: 'touch', clientX: 150, clientY: 102 })
    fireEvent.pointerMove(content, { pointerType: 'touch', clientX: 50, clientY: 103 })
    fireEvent.pointerUp(content, { pointerType: 'touch', clientX: 50, clientY: 103 })

    expect(
      container.querySelector('button[aria-label="Vymazať položku"]'),
    ).toHaveAttribute('aria-hidden', 'false')
  })

  it('snaps an open swipe closed when it loses exclusive open status', () => {
    const { container, rerender } = render(
      <ActiveItemRow {...makeProps({ isSwipeOpen: true })} />,
    )

    const content = screen.getByTestId('active-item-content-item-1')
    content.setPointerCapture = vi.fn()

    fireEvent.pointerDown(content, { pointerType: 'touch', clientX: 200, clientY: 100 })
    fireEvent.pointerMove(content, { pointerType: 'touch', clientX: 150, clientY: 102 })
    fireEvent.pointerMove(content, { pointerType: 'touch', clientX: 50, clientY: 103 })
    fireEvent.pointerUp(content, { pointerType: 'touch', clientX: 50, clientY: 103 })

    expect(
      container.querySelector('button[aria-label="Vymazať položku"]'),
    ).toHaveAttribute('aria-hidden', 'false')

    rerender(<ActiveItemRow {...makeProps({ isSwipeOpen: false })} />)

    expect(
      container.querySelector('button[aria-label="Vymazať položku"]'),
    ).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows a pending-sync icon when the item has not synced yet', () => {
    render(<ActiveItemRow {...makeProps({ item: makeActiveItem({ pendingSync: true }) })} />)

    expect(screen.getByTitle('Čaká na odoslanie')).toBeInTheDocument()
  })

  it('does not show a pending-sync icon once the item has synced', () => {
    render(<ActiveItemRow {...makeProps({ item: makeActiveItem({ pendingSync: false }) })} />)

    expect(screen.queryByTitle('Čaká na odoslanie')).not.toBeInTheDocument()
  })

  describe('inline edit', () => {
    it('resets an open swipe when it enters edit mode via the desktop Pencil button', () => {
      const { container, rerender } = render(
        <ActiveItemRow {...makeProps({ isSwipeOpen: true })} />,
      )

      const content = screen.getByTestId('active-item-content-item-1')
      content.setPointerCapture = vi.fn()
      fireEvent.pointerDown(content, { pointerType: 'touch', clientX: 200, clientY: 100 })
      fireEvent.pointerMove(content, { pointerType: 'touch', clientX: 150, clientY: 102 })
      fireEvent.pointerMove(content, { pointerType: 'touch', clientX: 50, clientY: 103 })
      fireEvent.pointerUp(content, { pointerType: 'touch', clientX: 50, clientY: 103 })

      expect(
        container.querySelector('button[aria-label="Vymazať položku"]'),
      ).toHaveAttribute('aria-hidden', 'false')

      // Simulate the parent switching this row into edit mode (as it would
      // after the desktop Pencil button's onClick calls onStartEdit).
      rerender(<ActiveItemRow {...makeProps({ isSwipeOpen: true, isEditing: true })} />)

      const deleteButton = container.querySelector(
        'button[aria-label="Vymazať položku"]',
      )
      expect(deleteButton).toHaveAttribute('aria-hidden', 'true')
      // Regression test: aria-hidden alone doesn't hide the buttons
      // visually -- the edit form is a normal-flow sibling, not something
      // that overlaps/covers the absolutely-positioned swipe underlay, so
      // it needs its own visibility:hidden or it visibly peeks out from
      // behind the edit input.
      expect(deleteButton?.parentElement).toHaveStyle({ visibility: 'hidden' })
    })

    it('renders a text input pre-filled with the item text when editing', () => {
      render(
        <ActiveItemRow
          {...makeProps({ item: makeActiveItem({ text: 'mlieko' }), isEditing: true })}
        />,
      )

      expect(screen.getByRole('textbox')).toHaveValue('mlieko')
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })

    it('submits the trimmed text on Enter', async () => {
      const onSubmitEdit = vi.fn()
      const user = userEvent.setup()
      render(
        <ActiveItemRow
          {...makeProps({
            item: makeActiveItem({ id: 'item-1', text: 'mlieko' }),
            isEditing: true,
            onSubmitEdit,
          })}
        />,
      )

      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '  mlieko 2l  {Enter}')

      expect(onSubmitEdit).toHaveBeenCalledWith('item-1', 'mlieko 2l')
    })

    it('cancels without saving on Escape', async () => {
      const onSubmitEdit = vi.fn()
      const onCancelEdit = vi.fn()
      const user = userEvent.setup()
      render(
        <ActiveItemRow
          {...makeProps({
            item: makeActiveItem({ text: 'mlieko' }),
            isEditing: true,
            onSubmitEdit,
            onCancelEdit,
          })}
        />,
      )

      const input = screen.getByRole('textbox')
      await user.type(input, ' 2l')
      await user.keyboard('{Escape}')

      expect(onCancelEdit).toHaveBeenCalled()
      expect(onSubmitEdit).not.toHaveBeenCalled()
    })

    it('saves on blur', () => {
      const onSubmitEdit = vi.fn()
      render(
        <ActiveItemRow
          {...makeProps({
            item: makeActiveItem({ id: 'item-1', text: 'mlieko' }),
            isEditing: true,
            onSubmitEdit,
          })}
        />,
      )

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'chlieb' } })
      fireEvent.blur(input)

      expect(onSubmitEdit).toHaveBeenCalledWith('item-1', 'chlieb')
    })

    it('does not save on blur after an Escape cancel', () => {
      const onSubmitEdit = vi.fn()
      const onCancelEdit = vi.fn()
      render(
        <ActiveItemRow
          {...makeProps({
            item: makeActiveItem({ text: 'mlieko' }),
            isEditing: true,
            onSubmitEdit,
            onCancelEdit,
          })}
        />,
      )

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'chlieb' } })
      fireEvent.keyDown(input, { key: 'Escape' })
      fireEvent.blur(input)

      expect(onSubmitEdit).not.toHaveBeenCalled()
    })

    it('cancels instead of submitting when the text is emptied', async () => {
      const onSubmitEdit = vi.fn()
      const onCancelEdit = vi.fn()
      const user = userEvent.setup()
      render(
        <ActiveItemRow
          {...makeProps({
            item: makeActiveItem({ text: 'mlieko' }),
            isEditing: true,
            onSubmitEdit,
            onCancelEdit,
          })}
        />,
      )

      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '   {Enter}')

      expect(onSubmitEdit).not.toHaveBeenCalled()
      expect(onCancelEdit).toHaveBeenCalled()
    })
  })
})
