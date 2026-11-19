import { useCallback, useState } from 'react'
import type { User } from 'firebase/auth'
import { addItem } from '@/features/items/itemApi'
import type { ItemRegistry } from './useItemRegistry'

// Which list the bottom "add item" form writes to. Deliberately separate
// from the collapsed-sections state -- collapsing the target via its chevron
// must not clear the selection.
export function useAddTarget({
  user,
  getActiveItems,
  requestScroll,
  expandIfCollapsed,
}: {
  user: User | null
  getActiveItems: ItemRegistry['getActiveItems']
  requestScroll: ItemRegistry['requestScroll']
  expandIfCollapsed: (listId: string) => void
}) {
  const [addTargetListId, setAddTargetListId] = useState<string | null>(null)
  const [addItemError, setAddItemError] = useState<string | null>(null)

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

  // Not built on useAddItemSubmit: that hook takes activeItems as a plain
  // param, which would read the registry's ref during render (refs must
  // only be read in effects/handlers). Reading it here instead mirrors the
  // drag handlers.
  const handleAddItem = useCallback(
    async (text: string) => {
      if (!user || !addTargetListId) {
        return
      }
      const listId = addTargetListId
      requestScroll(listId)
      expandIfCollapsed(listId)
      setAddItemError(null)
      try {
        await addItem(listId, text, user.uid, getActiveItems(listId))
      } catch {
        setAddItemError('unknown')
      }
    },
    [user, addTargetListId, expandIfCollapsed, requestScroll, getActiveItems],
  )

  return {
    addTargetListId,
    isAddTarget,
    selectAddTarget,
    addItemError,
    handleAddItem,
  }
}
