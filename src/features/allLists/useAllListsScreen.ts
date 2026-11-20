import { useCallback, useMemo } from 'react'
import { useSignedInUid } from '@/features/auth/useSignedInUid'
import { useCreateListForm } from '@/features/lists/useCreateListForm'
import { useItemsByList } from '@/features/items/useItemsByList'
import { useScrollNewItemIntoView } from '@/features/items/useScrollNewItemIntoView'
import { useCollapsedSections } from './useCollapsedSections'
import { useAllListsDrag } from './useAllListsDrag'
import { useAddTarget } from './useAddTarget'
import { useDoneItemsActions } from './useDoneItemsActions'
import { mergeDoneItems } from './allListsService'
import type { ActiveItem } from '@/features/items/types'
import type { ShoppingList } from '@/features/lists/types'

const NO_ITEMS: ActiveItem[] = []

// Screen-level composer: subscribes to every list's items once, here, and
// hands each concern (collapsed sections, drag, add target, done actions,
// create form) its own single-intent hook; this wires them together and
// returns each concern's own result as a group for AllListsScreen to render.
//
// - `activeItemsOf`: a list's active items, sorted -- what its section
//   renders. `mainScrollRef`: the screen's one scroll container (all
//   sections share it), where an item the user just added or unchecked is
//   scrolled into view. `doneItems`: the combined Done section's rows
//   (docs/feature-all-lists-done-items.md).
// - `createForm`: add-list sheet -- creating here deliberately does not
//   navigate away (docs/feature-all-lists-add-list.md); the new list's
//   section just appears already expanded since nothing marks it collapsed.
export function useAllListsScreen(lists: ShoppingList[]) {
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

  const createForm = useCreateListForm({ uid })

  const drag = useAllListsDrag(activeItemsByList)
  const addTarget = useAddTarget({
    uid,
    activeItemsOf,
    requestScroll,
    expandIfCollapsed,
  })
  const doneActions = useDoneItemsActions({
    lists,
    doneItems,
    activeItemsOf,
    requestScroll,
    expandIfCollapsed,
  })

  return {
    isExpanded,
    toggleSection,
    activeItemsOf,
    mainScrollRef,
    doneItems,
    createForm,
    drag,
    addTarget,
    doneActions,
  }
}
