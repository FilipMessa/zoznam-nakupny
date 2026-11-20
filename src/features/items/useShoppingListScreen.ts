import { useMemo } from 'react'
import { useSignedInUid } from '@/features/auth/useSignedInUid'
import { useItems } from './useItems'
import { sortItems } from './itemService'
import { useScrollNewItemIntoView } from './useScrollNewItemIntoView'
import { useSwipeRowRegistry } from './useSwipeRowRegistry'
import { useItemEditing } from './useItemEditing'
import { useAddItemSubmit } from './useAddItemSubmit'
import { useItemActions } from './useItemActions'
import { usePurchaseSuggestions } from './usePurchaseSuggestions'

export function useShoppingListScreen(listId: string) {
  const uid = useSignedInUid()
  const { items, itemsLoading } = useItems(listId)

  const { active, done } = useMemo(() => sortItems(items), [items])
  const activeItemsByList = useMemo(
    () => new Map([[listId, active]]),
    [listId, active],
  )

  const { mainRef, requestScrollAfterAdd } =
    useScrollNewItemIntoView(activeItemsByList)
  const swipe = useSwipeRowRegistry()
  const editing = useItemEditing(listId)
  const add = useAddItemSubmit({
    listId,
    uid,
    activeItems: active,
    doneItems: done,
    onAddStart: requestScrollAfterAdd,
  })
  const suggest = usePurchaseSuggestions(listId, active)
  const actions = useItemActions({ listId, uid, activeItems: active })

  return {
    itemsLoading,
    active,
    done,
    mainRef,
    swipe,
    editing,
    add,
    suggest,
    actions,
  }
}
