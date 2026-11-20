import { useServiceWorkerUpdate } from '@/lib/useServiceWorkerUpdate'

// Renders nothing: mounts the service worker registration and its
// "new version available" toast once, app-wide.
export function ServiceWorkerUpdatePrompt() {
  useServiceWorkerUpdate()
  return null
}
