import { useAuth } from '@/features/auth/useAuth'
import { useCreateListForm } from '@/features/lists/useCreateListForm'
import { useCollapsedSections } from './useCollapsedSections'
import { useItemRegistry } from './useItemRegistry'
import { useAllListsDrag } from './useAllListsDrag'
import { useAddTarget } from './useAddTarget'
import { useDoneItemsActions } from './useDoneItemsActions'
import type { DoneItemWithOrigin } from './allListsService'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { ShoppingItem } from '@/features/items/types'
import type { ShoppingList } from '@/features/lists/types'

export interface UseAllListsScreenResult {
  isExpanded: (listId: string) => boolean
  toggleSection: (listId: string) => void
  registerActiveItems: (listId: string, items: ShoppingItem[]) => void
  // Add-list sheet -- creating here deliberately does not navigate away
  // (see docs/feature-all-lists-add-list.md); the new list's section just
  // appears already expanded since nothing marks it collapsed (see
  // useCollapsedSections).
  showCreateForm: boolean
  openCreateForm: () => void
  handleCancelCreate: () => void
  handleCreate: (name: string) => Promise<void>
  createPending: boolean
  createError: string | null
  // Deliberately separate from the collapsed-sections state -- collapsing
  // the target via its chevron must not clear the selection.
  addTargetListId: string | null
  isAddTarget: (listId: string) => boolean
  selectAddTarget: (listId: string) => void
  registerScrollRequester: (listId: string, requestScroll: () => void) => void
  addItemError: string | null
  handleAddItem: (text: string) => Promise<void>
  // Combined Done section (docs/feature-all-lists-done-items.md).
  registerDoneItems: (listId: string, items: ShoppingItem[]) => void
  doneItems: DoneItemWithOrigin[]
  handleUncheckDone: (listId: string, itemId: string) => Promise<void>
  handleDeleteDone: (listId: string, itemId: string) => Promise<void>
  handleClearAllDone: () => Promise<void>
  // Dragged item for <DragOverlay> (see useAllListsDrag).
  draggedItem: ShoppingItem | null
  handleDragStart: (event: DragStartEvent) => void
  handleDragEnd: (event: DragEndEvent) => void
  handleDragCancel: () => void
}

// Screen-level composer: each concern lives in its own single-intent hook
// (collapsed sections, item registry, drag, add target, done actions) and
// this just wires them together into the flat shape AllListsScreen renders.
export function useAllListsScreen(
  lists: ShoppingList[],
): UseAllListsScreenResult {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const { isExpanded, toggleSection, expandIfCollapsed } =
    useCollapsedSections()
  const registry = useItemRegistry(lists)
  const {
    registerActiveItems,
    getActiveItems,
    getActiveItemsByListId,
    registerScrollRequester,
    requestScroll,
    registerDoneItems,
    doneItems,
  } = registry

  const {
    showCreateForm,
    openCreateForm,
    handleCancelCreate,
    handleCreate,
    createPending,
    createError,
  } = useCreateListForm({ uid, onCreated: () => {} })

  const drag = useAllListsDrag({ getActiveItems, getActiveItemsByListId })
  const addTarget = useAddTarget({
    uid,
    getActiveItems,
    requestScroll,
    expandIfCollapsed,
  })
  const doneActions = useDoneItemsActions({
    lists,
    getActiveItems,
    requestScroll,
    expandIfCollapsed,
  })

  return {
    isExpanded,
    toggleSection,
    registerActiveItems,
    showCreateForm,
    openCreateForm,
    handleCancelCreate,
    handleCreate,
    createPending,
    createError,
    registerScrollRequester,
    registerDoneItems,
    doneItems,
    ...drag,
    ...addTarget,
    ...doneActions,
  }
}
