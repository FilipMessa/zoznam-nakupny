import { useCallback, useMemo, type RefObject } from 'react'
import { useSignedInUid } from '@/features/auth/useSignedInUid'
import { useCreateListForm } from '@/features/lists/useCreateListForm'
import { useItemsByList } from '@/features/items/useItemsByList'
import { useScrollNewItemIntoView } from '@/features/items/useScrollNewItemIntoView'
import { useCollapsedSections } from './useCollapsedSections'
import { useAllListsDrag } from './useAllListsDrag'
import { useAddTarget } from './useAddTarget'
import { useDoneItemsActions } from './useDoneItemsActions'
import { mergeDoneItems, type DoneItemWithOrigin } from './allListsService'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { AddItemError, ShoppingItem } from '@/features/items/types'
import type { CreateListError } from '@/features/lists/types'
import type { ShoppingList } from '@/features/lists/types'

export interface UseAllListsScreenResult {
  isExpanded: (listId: string) => boolean
  toggleSection: (listId: string) => void
  // A list's active items, sorted -- what its AllListsSection renders.
  activeItemsOf: (listId: string) => ShoppingItem[]
  // The screen's one scroll container (all sections share it), where an
  // item the user just added or unchecked is scrolled into view.
  mainScrollRef: RefObject<HTMLElement | null>
  // Add-list sheet -- creating here deliberately does not navigate away
  // (see docs/feature-all-lists-add-list.md); the new list's section just
  // appears already expanded since nothing marks it collapsed (see
  // useCollapsedSections).
  showCreateForm: boolean
  openCreateForm: () => void
  handleCancelCreate: () => void
  handleCreate: (name: string) => Promise<void>
  createPending: boolean
  createError: CreateListError | null
  // Deliberately separate from the collapsed-sections state -- collapsing
  // the target via its chevron must not clear the selection.
  addTargetListId: string | null
  isAddTarget: (listId: string) => boolean
  selectAddTarget: (listId: string) => void
  addItemError: AddItemError | null
  handleAddItem: (text: string) => Promise<void>
  // Combined Done section (docs/feature-all-lists-done-items.md).
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

const NO_ITEMS: ShoppingItem[] = []

// Screen-level composer: subscribes to every list's items once, here, and
// hands each concern (collapsed sections, drag, add target, done actions)
// its own single-intent hook; this just wires them together into the flat
// shape AllListsScreen renders.
export function useAllListsScreen(
  lists: ShoppingList[],
): UseAllListsScreenResult {
  const uid = useSignedInUid()
  const { isExpanded, toggleSection, expandIfCollapsed } =
    useCollapsedSections()

  const itemsByList = useItemsByList(lists.map((list) => list.id))
  const activeItemsByList = useMemo(
    () => new Map(Array.from(itemsByList, ([id, { active }]) => [id, active])),
    [itemsByList],
  )
  const doneItems = useMemo(() => mergeDoneItems(itemsByList), [itemsByList])
  const activeItemsOf = useCallback(
    (listId: string) => activeItemsByList.get(listId) ?? NO_ITEMS,
    [activeItemsByList],
  )

  const { mainRef: mainScrollRef, requestScrollAfterAdd: requestScroll } =
    useScrollNewItemIntoView(activeItemsByList)

  const {
    showCreateForm,
    openCreateForm,
    handleCancelCreate,
    handleCreate,
    createPending,
    createError,
  } = useCreateListForm({ uid, onCreated: () => {} })

  const drag = useAllListsDrag(activeItemsByList)
  const addTarget = useAddTarget({
    uid,
    activeItemsOf,
    requestScroll,
    expandIfCollapsed,
  })
  const doneActions = useDoneItemsActions({
    lists,
    activeItemsOf,
    requestScroll,
    expandIfCollapsed,
  })

  return {
    isExpanded,
    toggleSection,
    activeItemsOf,
    mainScrollRef,
    showCreateForm,
    openCreateForm,
    handleCancelCreate,
    handleCreate,
    createPending,
    createError,
    doneItems,
    ...drag,
    ...addTarget,
    ...doneActions,
  }
}
