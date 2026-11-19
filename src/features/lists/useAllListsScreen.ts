import { useCallback, useMemo, useRef, useState } from 'react'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useAuth } from '@/features/auth/useAuth'
import {
  reorderActiveItems,
  insertActiveOrder,
} from '@/features/items/itemLogic'
import {
  addItem,
  reorderItem,
  moveItemToList,
  uncheckItem,
  deleteItem,
  clearDoneItems,
} from '@/features/items/itemService'
import { moveConflictMessage } from '@/features/items/moveConflictMessages'
import { notify } from '@/lib/toaster'
import { useCreateListForm } from './useCreateListForm'
import { mergeDoneItems, type DoneItemWithOrigin } from './allListsDoneItems'
import {
  LIST_HEADER_DROPPABLE_PREFIX,
  LIST_BODY_DROPPABLE_PREFIX,
} from '@/features/lists/components/AllListsSection'
import type { ShoppingItem } from '@/features/items/types'
import type { ShoppingList } from './types'

export interface UseAllListsScreenResult {
  isExpanded: (listId: string) => boolean
  toggleSection: (listId: string) => void
  registerActiveItems: (listId: string, items: ShoppingItem[]) => void
  // Add-list sheet -- creating here deliberately does not navigate away
  // (see docs/feature-all-lists-add-list.md); the new list's section just
  // appears already expanded since collapsedListIds never named it.
  showCreateForm: boolean
  openCreateForm: () => void
  handleCancelCreate: () => void
  handleCreate: (name: string) => Promise<void>
  createPending: boolean
  createError: string | null
  // Deliberately separate from collapsedListIds -- collapsing the target
  // via its chevron must not clear the selection.
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
  // The item currently being dragged, for <DragOverlay> to render a
  // floating clone of -- needed because a dragged row's own useSortable
  // transform only reflects its position *within its own SortableContext*
  // (dnd-kit computes it from that context's own items array), so it stops
  // following the pointer the moment `over` leaves the row's own list.
  // Without an overlay, a cross-list drag would visually snap back to its
  // origin mid-drag even though the resulting write is still correct.
  draggedItem: ShoppingItem | null
  handleDragStart: (event: DragStartEvent) => void
  handleDragEnd: (event: DragEndEvent) => void
  handleDragCancel: () => void
}

// Resolves a drop target's destination List id, or null if `overId` isn't a
// recognised drop target at all. `undefined` toIndex means "append to the
// end" (dropped on a list's collapsed header, empty body, or past its last
// item).
function resolveDrop(
  overId: string | number,
  destItemsByListId: Map<string, ShoppingItem[]>,
  overData: Record<string, unknown> | undefined,
): { destListId: string; toIndex: number | undefined } | null {
  const overIdStr = String(overId)

  if (overIdStr.startsWith(LIST_HEADER_DROPPABLE_PREFIX)) {
    return {
      destListId: overIdStr.slice(LIST_HEADER_DROPPABLE_PREFIX.length),
      toIndex: undefined,
    }
  }
  if (overIdStr.startsWith(LIST_BODY_DROPPABLE_PREFIX)) {
    return {
      destListId: overIdStr.slice(LIST_BODY_DROPPABLE_PREFIX.length),
      toIndex: undefined,
    }
  }

  // Otherwise `over` is an item row -- its sortableData carries the list it
  // belongs to (see ActiveItemRow's sortableData prop / AllListsSection).
  const destListId = overData?.listId
  if (typeof destListId !== 'string') {
    return null
  }
  const destItems = destItemsByListId.get(destListId) ?? []
  const index = destItems.findIndex((item) => item.id === overIdStr)
  return { destListId, toIndex: index === -1 ? undefined : index }
}

// All sections start expanded -- this screen's whole purpose is moving
// items *between* lists, so requiring a manual expand step before a
// cross-list drag is even possible would work against that. Collapsing a
// section is a purely opt-in way to reduce clutter, not persisted across
// screen opens (a fresh Set every time this hook mounts).
export function useAllListsScreen(
  lists: ShoppingList[],
): UseAllListsScreenResult {
  const { user } = useAuth()
  const [collapsedListIds, setCollapsedListIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [draggedItem, setDraggedItem] = useState<ShoppingItem | null>(null)

  const {
    showCreateForm,
    openCreateForm,
    handleCancelCreate,
    handleCreate,
    createPending,
    createError,
  } = useCreateListForm({ user, onCreated: () => {} })

  // Each AllListsSection reports its own current active items here on every
  // render -- the shared DndContext lives above all the sections, so its
  // onDragEnd needs synchronous read access to every list's items to
  // compute a drop's destination order, something no single section's own
  // useItems subscription has on its own. A ref (not state) because writes
  // happen on every section render and must never themselves trigger a
  // re-render of this hook's owner.
  const activeItemsByListId = useRef<Map<string, ShoppingItem[]>>(new Map())

  const registerActiveItems = useCallback(
    (listId: string, items: ShoppingItem[]) => {
      activeItemsByListId.current.set(listId, items)
    },
    [],
  )

  const isExpanded = useCallback(
    (listId: string) => !collapsedListIds.has(listId),
    [collapsedListIds],
  )

  const toggleSection = useCallback((listId: string) => {
    setCollapsedListIds((prev) => {
      const next = new Set(prev)
      if (next.has(listId)) {
        next.delete(listId)
      } else {
        next.add(listId)
      }
      return next
    })
  }, [])

  // Expands `listId` if it's currently collapsed, otherwise a no-op --
  // written as a functional setState update (rather than reading
  // isExpanded/calling toggleSection) so callers below don't need either in
  // their own useCallback deps, which would otherwise force them to change
  // identity every time collapsedListIds does.
  const expandIfCollapsed = useCallback((listId: string) => {
    setCollapsedListIds((prev) => {
      if (!prev.has(listId)) {
        return prev
      }
      const next = new Set(prev)
      next.delete(listId)
      return next
    })
  }, [])

  const [addTargetListId, setAddTargetListId] = useState<string | null>(null)

  const isAddTarget = useCallback(
    (listId: string) => addTargetListId === listId,
    [addTargetListId],
  )

  const selectAddTarget = useCallback(
    (listId: string) => {
      setAddTargetListId(listId)
      expandIfCollapsed(listId)
    },
    [expandIfCollapsed],
  )

  // Same ref-registry shape as activeItemsByListId above.
  const scrollRequestersByListId = useRef<Map<string, () => void>>(new Map())

  const registerScrollRequester = useCallback(
    (listId: string, requestScroll: () => void) => {
      scrollRequestersByListId.current.set(listId, requestScroll)
    },
    [],
  )

  const [addItemError, setAddItemError] = useState<string | null>(null)

  // Not built on useAddItemSubmit: that hook takes activeItems as a plain
  // param, which would read activeItemsByListId.current during render
  // (refs must only be read in effects/handlers). Reading it here instead
  // mirrors handleDragStart/handleDragEnd below.
  const handleAddItem = useCallback(
    async (text: string) => {
      if (!user || !addTargetListId) {
        return
      }
      const listId = addTargetListId
      scrollRequestersByListId.current.get(listId)?.()
      expandIfCollapsed(listId)
      setAddItemError(null)
      try {
        const activeItems = activeItemsByListId.current.get(listId) ?? []
        await addItem(listId, text, user.uid, activeItems)
      } catch {
        setAddItemError('unknown')
      }
    },
    [user, addTargetListId, expandIfCollapsed],
  )

  // Unlike activeItemsByListId (a ref -- only read synchronously inside
  // event handlers), this must be state: the combined Done section needs to
  // render reactively as any list's done items change.
  const [doneItemsByListId, setDoneItemsByListId] = useState<
    Map<string, ShoppingItem[]>
  >(new Map())

  const registerDoneItems = useCallback(
    (listId: string, items: ShoppingItem[]) => {
      setDoneItemsByListId((prev) => new Map(prev).set(listId, items))
    },
    [],
  )

  // Memoized so AllListsDoneSection (React.memo) only re-renders when the
  // merge's actual inputs change, not on every unrelated render of this hook.
  const doneItems = useMemo(
    () => mergeDoneItems(lists, doneItemsByListId),
    [lists, doneItemsByListId],
  )

  const handleUncheckDone = useCallback(
    async (listId: string, itemId: string) => {
      scrollRequestersByListId.current.get(listId)?.()
      expandIfCollapsed(listId)
      const activeItems = activeItemsByListId.current.get(listId) ?? []
      await uncheckItem(listId, itemId, activeItems)
    },
    [expandIfCollapsed],
  )

  const handleDeleteDone = useCallback(
    async (listId: string, itemId: string) => {
      await deleteItem(listId, itemId)
    },
    [],
  )

  const handleClearAllDone = useCallback(async () => {
    const results = await Promise.allSettled(
      lists.map((list) => clearDoneItems(list.id)),
    )
    const hasFailure = results.some((result) => result.status === 'rejected')
    if (hasFailure) {
      console.error('Failed to clear done items for one or more lists', results)
      notify('Vyčistenie sa nepodarilo pre niektoré zoznamy.', 'error')
    }
  }, [lists])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const listId = event.active.data.current?.listId
    if (typeof listId !== 'string') {
      return
    }
    const items = activeItemsByListId.current.get(listId) ?? []
    setDraggedItem(items.find((item) => item.id === event.active.id) ?? null)
  }, [])

  const handleDragCancel = useCallback(() => {
    setDraggedItem(null)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setDraggedItem(null)

    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const sourceListId = active.data.current?.listId
    if (typeof sourceListId !== 'string') {
      return
    }
    const sourceItems = activeItemsByListId.current.get(sourceListId) ?? []
    const draggedItem = sourceItems.find((item) => item.id === active.id)
    if (!draggedItem) {
      // The item vanished from this section between the drag starting and
      // ending (e.g. it was checked off or deleted by another Member
      // mid-drag) -- nothing sane to write.
      return
    }

    const drop = resolveDrop(
      over.id,
      activeItemsByListId.current,
      over.data.current,
    )
    if (!drop) {
      return
    }
    const { destListId, toIndex } = drop

    if (destListId === sourceListId) {
      const fromIndex = sourceItems.findIndex((item) => item.id === active.id)
      const resolvedToIndex = toIndex ?? sourceItems.length - 1
      if (fromIndex === resolvedToIndex) {
        return
      }
      const newOrder = reorderActiveItems(
        sourceItems,
        fromIndex,
        resolvedToIndex,
      )
      reorderItem(sourceListId, String(active.id), newOrder).catch(
        (error: unknown) => {
          console.error('Failed to reorder item', error)
          notify('Preusporiadanie sa nepodarilo.', 'error')
        },
      )
      return
    }

    const destItems = activeItemsByListId.current.get(destListId) ?? []
    const resolvedToIndex = toIndex ?? destItems.length
    const newOrder = insertActiveOrder(destItems, resolvedToIndex)

    moveItemToList(sourceListId, destListId, draggedItem, newOrder)
      .then((result) => {
        if (!result.ok) {
          notify(moveConflictMessage(result.reason), 'error')
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to move item between lists', error)
        notify('Presun sa nepodarilo.', 'error')
      })
  }, [])

  return {
    isExpanded,
    toggleSection,
    registerActiveItems,
    draggedItem,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    showCreateForm,
    openCreateForm,
    handleCancelCreate,
    handleCreate,
    createPending,
    createError,
    addTargetListId,
    isAddTarget,
    selectAddTarget,
    registerScrollRequester,
    addItemError,
    handleAddItem,
    registerDoneItems,
    doneItems,
    handleUncheckDone,
    handleDeleteDone,
    handleClearAllDone,
  }
}
