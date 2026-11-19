import { useAuth } from '@/features/auth/useAuth'
import { useItems } from './useItems'
import { sortItems } from './itemService'
import { useScrollNewItemIntoView } from './useScrollNewItemIntoView'
import { useSwipeRowRegistry } from './useSwipeRowRegistry'
import { useItemEditing } from './useItemEditing'
import { useAddItemSubmit } from './useAddItemSubmit'
import { useItemActions } from './useItemActions'

export function useShoppingListScreen(listId: string) {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const { items, itemsLoading } = useItems(listId)

  const { active, done } = sortItems(items)

  const { mainRef, requestScrollAfterAdd } = useScrollNewItemIntoView(items)
  const { openSwipeItemId, handleSwipeOpenChange, handleListScroll } =
    useSwipeRowRegistry()
  const { editingItemId, handleStartEdit, handleSubmitEdit, handleCancelEdit } =
    useItemEditing(listId)
  const { addError, handleAdd } = useAddItemSubmit({
    listId,
    uid,
    activeItems: active,
    onAddStart: requestScrollAfterAdd,
  })
  const {
    handleCheck,
    handleUncheck,
    handleReorder,
    handleDelete,
    handleClearDone,
  } = useItemActions({ listId, uid, activeItems: active })

  return {
    itemsLoading,
    active,
    done,
    mainRef,
    addError,
    handleAdd,
    handleCheck,
    handleUncheck,
    handleReorder,
    handleDelete,
    handleClearDone,
    editingItemId,
    handleStartEdit,
    handleSubmitEdit,
    handleCancelEdit,
    openSwipeItemId,
    handleSwipeOpenChange,
    handleListScroll,
  }
}
