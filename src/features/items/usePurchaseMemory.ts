import { useEffect, useState } from 'react'
import { subscribePurchaseMemory } from './itemApi'
import type { PurchaseMemoryEntry } from './types'

// The Family's whole Purchase Memory, realtime (ADR 0004). Empty until the
// first snapshot, which only means no suggestions for a moment.
export function usePurchaseMemory(): PurchaseMemoryEntry[] {
  const [entries, setEntries] = useState<PurchaseMemoryEntry[]>([])

  useEffect(() => subscribePurchaseMemory(setEntries), [])

  return entries
}
