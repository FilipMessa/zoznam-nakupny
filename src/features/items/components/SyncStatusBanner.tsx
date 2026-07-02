import { useEffect, useRef, useState } from 'react'
import { Box } from '@chakra-ui/react'

export interface SyncStatusBannerProps {
  pendingCount: number
}

const SYNCED_MESSAGE_DURATION_MS = 2000

export function SyncStatusBanner({ pendingCount }: SyncStatusBannerProps) {
  const [showSynced, setShowSynced] = useState(false)
  const wasPending = useRef(pendingCount > 0)

  useEffect(() => {
    if (wasPending.current && pendingCount === 0) {
      setShowSynced(true)
      const timeout = setTimeout(
        () => setShowSynced(false),
        SYNCED_MESSAGE_DURATION_MS,
      )
      wasPending.current = false
      return () => clearTimeout(timeout)
    }

    wasPending.current = pendingCount > 0
  }, [pendingCount])

  if (pendingCount > 0) {
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
        Synchronizujem {pendingCount}{' '}
        {pendingCount === 1 ? 'položku' : 'položiek'}…
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
