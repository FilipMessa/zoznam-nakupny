import { useState } from 'react'

export interface UseAllListsScreenResult {
  isExpanded: (listId: string) => boolean
  toggleSection: (listId: string) => void
}

// All sections start expanded -- this screen's whole purpose is moving
// items *between* lists, so requiring a manual expand step before a
// cross-list drag is even possible would work against that. Collapsing a
// section is a purely opt-in way to reduce clutter, not persisted across
// screen opens (a fresh Set every time this hook mounts).
export function useAllListsScreen(): UseAllListsScreenResult {
  const [collapsedListIds, setCollapsedListIds] = useState<Set<string>>(
    () => new Set(),
  )

  const isExpanded = (listId: string) => !collapsedListIds.has(listId)

  const toggleSection = (listId: string) => {
    setCollapsedListIds((prev) => {
      const next = new Set(prev)
      if (next.has(listId)) {
        next.delete(listId)
      } else {
        next.add(listId)
      }
      return next
    })
  }

  return { isExpanded, toggleSection }
}
