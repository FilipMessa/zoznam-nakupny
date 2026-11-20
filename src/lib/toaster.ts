import { createToaster } from '@chakra-ui/react'

export const toaster = createToaster({
  placement: 'bottom',
  pauseOnPageIdle: true,
})

// The single choke point for showing a toast -- nothing else in the app
// should call the Chakra toaster API directly, so the underlying transport
// can be swapped later without touching call sites.
export function notify(message: string, type: 'error' | 'info' = 'info'): void {
  toaster.create({ description: message, type })
}

// A sticky toast with one action button (stays until acted on or dismissed).
// Returns a function that dismisses it, for effect cleanups.
export function notifyWithAction(
  message: string,
  action: { label: string; onClick: () => void },
): () => void {
  const id = toaster.create({
    description: message,
    type: 'info',
    duration: Infinity,
    action,
  })
  return () => toaster.dismiss(id)
}
