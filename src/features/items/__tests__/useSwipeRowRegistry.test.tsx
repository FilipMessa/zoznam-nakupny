import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@/test/render'
import userEvent from '@testing-library/user-event'
import { ActiveItemsList } from '@/features/items/components/ActiveItemsList'
import { DoneItemsList } from '@/features/items/components/DoneItemsList'
import { useSwipeRowRegistry } from '@/features/items/useSwipeRowRegistry'
import type { ActiveItem, ShoppingItem } from '@/features/items/types'
import { touchGesture } from '@/test/touchGesture'

function makeItem(
  id: string,
  text: string,
  status: 'active' | 'done' = 'active',
): ActiveItem {
  return {
    id,
    text,
    status,
    activeOrder: 1,
    completedAt: null,
    completedBy: null,
    createdAt: null as unknown as ShoppingItem['createdAt'],
    createdBy: 'uid-1',
    updatedAt: null as unknown as ShoppingItem['updatedAt'],
  }
}

interface SectionProps {
  activeItems: ActiveItem[]
  doneItems?: ShoppingItem[]
  onCheck: (id: string) => void
  onUncheck?: (id: string) => void
}

// One registry over an active and a done list, as on the single-list screen
// (useShoppingListScreen); several of these side by side stand in for the
// All Lists screen, which runs one registry per section.
function RegistrySection({
  activeItems,
  doneItems = [],
  onCheck,
  onUncheck = vi.fn(),
}: SectionProps) {
  const { openSwipeItemId, handleSwipeOpenChange } = useSwipeRowRegistry()
  return (
    <>
      <ActiveItemsList
        items={activeItems}
        onCheck={onCheck}
        onDelete={vi.fn()}
        editingItemId={null}
        onStartEdit={vi.fn()}
        onSubmitEdit={vi.fn()}
        onCancelEdit={vi.fn()}
        openSwipeItemId={openSwipeItemId}
        onSwipeOpenChange={handleSwipeOpenChange}
      />
      {doneItems.length > 0 && (
        <DoneItemsList
          items={doneItems}
          onUncheck={onUncheck}
          onDelete={vi.fn()}
          openSwipeItemId={openSwipeItemId}
          onSwipeOpenChange={handleSwipeOpenChange}
        />
      )}
    </>
  )
}

function isOpen(container: HTMLElement, rowTestId: string) {
  return (
    container
      .querySelector(`[data-testid="${rowTestId}"]`)
      ?.querySelector('button[aria-label="Vymazať položku"]')
      ?.getAttribute('aria-hidden') === 'false'
  )
}

describe('useSwipeRowRegistry', () => {
  it('only closes the open row when another row is tapped, without checking it', () => {
    const onCheck = vi.fn()
    const { container } = render(
      <RegistrySection
        activeItems={[makeItem('a', 'mlieko'), makeItem('b', 'vajcia')]}
        onCheck={onCheck}
      />,
    )
    touchGesture(screen.getByTestId('active-item-content-a'), [150, 50])
    expect(isOpen(container, 'active-item-a')).toBe(true)

    touchGesture(screen.getByTestId('active-item-content-b'), [])
    fireEvent.click(screen.getByText('vajcia'))

    expect(isOpen(container, 'active-item-a')).toBe(false)
    expect(onCheck).not.toHaveBeenCalled()

    // The next tap on that row checks it as usual.
    touchGesture(screen.getByTestId('active-item-content-b'), [])
    fireEvent.click(screen.getByText('vajcia'))
    expect(onCheck).toHaveBeenCalledTimes(1)
    expect(onCheck).toHaveBeenCalledWith('b')
  })

  it('only closes the open row on a mouse click on another row', async () => {
    const onCheck = vi.fn()
    const user = userEvent.setup()
    const { container } = render(
      <RegistrySection
        activeItems={[makeItem('a', 'mlieko'), makeItem('b', 'vajcia')]}
        onCheck={onCheck}
      />,
    )
    touchGesture(screen.getByTestId('active-item-content-a'), [150, 50])

    await user.click(screen.getByText('vajcia'))

    expect(isOpen(container, 'active-item-a')).toBe(false)
    expect(onCheck).not.toHaveBeenCalled()
  })

  it('does not uncheck a done row tapped while an active row is open', () => {
    const onUncheck = vi.fn()
    const { container } = render(
      <RegistrySection
        activeItems={[makeItem('a', 'mlieko')]}
        doneItems={[makeItem('d', 'chlieb', 'done')]}
        onCheck={vi.fn()}
        onUncheck={onUncheck}
      />,
    )
    touchGesture(screen.getByTestId('active-item-content-a'), [150, 50])

    touchGesture(screen.getByTestId('done-item-content-d'), [])
    fireEvent.click(screen.getByText('chlieb'))

    expect(isOpen(container, 'active-item-a')).toBe(false)
    expect(onUncheck).not.toHaveBeenCalled()
  })

  it('does not check a row in another section tapped while a row is open', () => {
    const onCheckFirst = vi.fn()
    const onCheckSecond = vi.fn()
    const { container } = render(
      <>
        <RegistrySection
          activeItems={[makeItem('a', 'mlieko')]}
          onCheck={onCheckFirst}
        />
        <RegistrySection
          activeItems={[makeItem('b', 'vajcia')]}
          onCheck={onCheckSecond}
        />
      </>,
    )
    touchGesture(screen.getByTestId('active-item-content-a'), [150, 50])

    touchGesture(screen.getByTestId('active-item-content-b'), [])
    fireEvent.click(screen.getByText('vajcia'))

    expect(isOpen(container, 'active-item-a')).toBe(false)
    expect(onCheckSecond).not.toHaveBeenCalled()
    expect(onCheckFirst).not.toHaveBeenCalled()
  })
})
