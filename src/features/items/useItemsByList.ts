import { useEffect, useMemo, useRef, useState } from 'react'
import type { Unsubscribe } from 'firebase/firestore'
import { subscribeItems } from './itemApi'
import { sortItems, type SortedItems } from './itemService'

// Firestore document ids can't contain '/', so joining on it gives the
// effect below a dependency that only changes when the ids themselves do --
// callers typically pass a fresh array on every lists snapshot (a rename, a
// pendingSync flip), which must not tear down and recreate subscriptions.
const ID_SEPARATOR = '/'

const NO_ITEMS: SortedItems = { active: [], done: [] }

// Realtime items of several Lists at once, split into active/done like the
// single-list screen does: one subscribeItems per id, added and removed as
// `listIds` changes. The returned map has exactly one entry per requested
// id, in `listIds` order (empty until that list's first snapshot). Sorting
// happens per snapshot, so a list's entry -- and its active/done arrays --
// keep their reference until that list's own snapshot changes, and items
// inside keep theirs (createSnapshotMapper); memoized sections and rows of
// the other lists don't re-render.
export function useItemsByList(
  listIds: readonly string[],
): ReadonlyMap<string, SortedItems> {
  const [snapshots, setSnapshots] = useState<ReadonlyMap<string, SortedItems>>(
    () => new Map(),
  )
  const subscriptions = useRef(new Map<string, Unsubscribe>())
  const idsKey = listIds.join(ID_SEPARATOR)
  const ids = useMemo(
    () => (idsKey === '' ? [] : idsKey.split(ID_SEPARATOR)),
    [idsKey],
  )

  useEffect(() => {
    const wanted = new Set(ids)
    const active = subscriptions.current
    for (const [listId, unsubscribe] of active) {
      if (!wanted.has(listId)) {
        unsubscribe()
        active.delete(listId)
      }
    }
    for (const listId of wanted) {
      if (!active.has(listId)) {
        active.set(
          listId,
          subscribeItems(listId, (items) => {
            setSnapshots((prev) => new Map(prev).set(listId, sortItems(items)))
          }),
        )
      }
    }
  }, [ids])

  useEffect(() => {
    const active = subscriptions.current
    return () => {
      for (const unsubscribe of active.values()) {
        unsubscribe()
      }
      active.clear()
    }
  }, [])

  // Built from the requested ids rather than from `snapshots`, which still
  // holds the last snapshot of a list that has since been removed.
  return useMemo(() => {
    const byList = new Map<string, SortedItems>()
    for (const listId of ids) {
      byList.set(listId, snapshots.get(listId) ?? NO_ITEMS)
    }
    return byList
  }, [ids, snapshots])
}
