import { useEffect, useRef, useState } from 'react'
import { Box } from '@chakra-ui/react'

export interface SyncStatusBannerProps {
  pendingCount: number
}

const SYNCED_MESSAGE_DURATION_MS = 2000

// Firestore keeps retrying its Listen/Write streams while genuinely
// offline, which can flip an item's hasPendingWrites false/true a few
// times a second during those retries. Debouncing the *decrease* only
// (increases still show instantly) keeps this banner -- and the item list
// below it -- from visibly jittering during that churn, which otherwise
// shifts tap targets out from under the user's finger.
const HIDE_DEBOUNCE_MS = 800

function useStablePendingCount(pendingCount: number): number {
  const [stable, setStable] = useState(pendingCount)

  // Increases apply immediately. This adjusts state during rendering (the
  // React-recommended way to derive state from a prop change,
  // https://react.dev/learn/you-might-not-need-an-effect) rather than in
  // an effect, so there's no extra render on the way up.
  if (pendingCount > stable) {
    setStable(pendingCount)
  }

  useEffect(() => {
    if (pendingCount >= stable) {
      return
    }

    const timeout = setTimeout(
      () => setStable(pendingCount),
      HIDE_DEBOUNCE_MS,
    )
    return () => clearTimeout(timeout)
  }, [pendingCount, stable])

  return pendingCount > stable ? pendingCount : stable
}

export function SyncStatusBanner({ pendingCount }: SyncStatusBannerProps) {
  const stableCount = useStablePendingCount(pendingCount)
  const [showSynced, setShowSynced] = useState(false)
  const wasPending = useRef(stableCount > 0)

  useEffect(() => {
    if (wasPending.current && stableCount === 0) {
      setShowSynced(true)
      const timeout = setTimeout(
        () => setShowSynced(false),
        SYNCED_MESSAGE_DURATION_MS,
      )
      wasPending.current = false
      return () => clearTimeout(timeout)
    }

    wasPending.current = stableCount > 0
  }, [stableCount])

  if (stableCount > 0) {
    return (
      <Box
        role="status"
        padding="8px 16px"
        bg="bg.muted"
        color="fg.muted"
        fontSize="13px"
        fontWeight="600"
        textAlign="center"
      >
        Synchronizujem {stableCount}{' '}
        {stableCount === 1 ? 'položku' : 'položiek'}…
      </Box>
    )
  }

  if (showSynced) {
    return (
      <Box
        role="status"
        padding="8px 16px"
        bg="green.subtle"
        color="green.solid"
        fontSize="13px"
        fontWeight="600"
        textAlign="center"
      >
        Zosynchronizované
      </Box>
    )
  }

  return null
}
