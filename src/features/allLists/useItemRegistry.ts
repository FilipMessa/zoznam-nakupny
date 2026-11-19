import { useCallback, useMemo, useRef, useState } from 'react'
import { mergeDoneItems } from './allListsService'
import type { ShoppingItem } from '@/features/items/types'
import type { ShoppingList } from '@/features/lists/types'

// Each AllListsSection owns its own useItems subscription (see
// useAllListsSection) and reports what it knows up to here, because the
// shared DndContext and the combined Done section live above all sections.
export function useItemRegistry(lists: ShoppingList[]) {
  // A ref (not state) because writes happen on every section render and
  // must never themselves trigger a re-render of this hook's owner -- it is
  // only read synchronously inside event handlers (drag end, add, uncheck).
  const activeItemsByListId = useRef<Map<string, ShoppingItem[]>>(new Map())

  const registerActiveItems = useCallback(
    (listId: string, items: ShoppingItem[]) => {
      activeItemsByListId.current.set(listId, items)
    },
    [],
  )

  // Refs must only be read in effects/handlers, so consumers get accessors
  // to call from handlers rather than the map itself.
  const getActiveItems = useCallback(
    (listId: string) => activeItemsByListId.current.get(listId) ?? [],
    [],
  )

  const getActiveItemsByListId = useCallback(
    (): ReadonlyMap<string, ShoppingItem[]> => activeItemsByListId.current,
    [],
  )

  // Same ref-registry shape as activeItemsByListId above.
  const scrollRequestersByListId = useRef<Map<string, () => void>>(new Map())

  const registerScrollRequester = useCallback(
    (listId: string, requestScroll: () => void) => {
      scrollRequestersByListId.current.set(listId, requestScroll)
    },
    [],
  )

  const requestScroll = useCallback((listId: string) => {
    scrollRequestersByListId.current.get(listId)?.()
  }, [])

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
  // merge's actual inputs change, not on every unrelated render.
  const doneItems = useMemo(
    () => mergeDoneItems(lists, doneItemsByListId),
    [lists, doneItemsByListId],
  )

  return {
    registerActiveItems,
    getActiveItems,
    getActiveItemsByListId,
    registerScrollRequester,
    requestScroll,
    registerDoneItems,
    doneItems,
  }
}

export type ItemRegistry = ReturnType<typeof useItemRegistry>
