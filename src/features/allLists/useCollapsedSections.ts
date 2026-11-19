import { useCallback, useState } from 'react'
import { expandListId, toggleCollapsed } from './allListsService'

// All sections start expanded -- this screen's whole purpose is moving
// items *between* lists, so requiring a manual expand step before a
// cross-list drag is even possible would work against that. Collapsing a
// section is a purely opt-in way to reduce clutter, not persisted across
// screen opens (a fresh Set every time this hook mounts).
export function useCollapsedSections() {
  const [collapsedListIds, setCollapsedListIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )

  const isExpanded = useCallback(
    (listId: string) => !collapsedListIds.has(listId),
    [collapsedListIds],
  )

  const toggleSection = useCallback((listId: string) => {
    setCollapsedListIds((prev) => toggleCollapsed(prev, listId))
  }, [])

  // Expands `listId` if it's currently collapsed, otherwise a no-op --
  // written as a functional setState update (rather than reading
  // isExpanded/calling toggleSection) so callers don't need either in their
  // own useCallback deps, which would otherwise force them to change
  // identity every time collapsedListIds does.
  const expandIfCollapsed = useCallback((listId: string) => {
    setCollapsedListIds((prev) => expandListId(prev, listId))
  }, [])

  return { isExpanded, toggleSection, expandIfCollapsed }
}
