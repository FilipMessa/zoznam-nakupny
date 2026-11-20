import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { notifyWithAction } from './toaster'

// An installed PWA can stay open (or suspended in the background) for days
// without a navigation, which is the only time the browser checks for a new
// service worker on its own -- so poll for one as well.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

// Registers the service worker (vite-plugin-pwa, `registerType: 'prompt'`)
// and, once a new version is downloaded and waiting, asks the user to reload
// instead of reloading under them: an automatic reload could drop a half-typed
// item. Until they accept, the old version keeps running. A no-op in dev,
// where no service worker is built.
export function useServiceWorkerUpdate(): void {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) {
        return
      }
      setInterval(() => {
        if (navigator.onLine) {
          void registration.update()
        }
      }, UPDATE_CHECK_INTERVAL_MS)
    },
  })

  useEffect(() => {
    if (!needRefresh) {
      return
    }
    return notifyWithAction('Je dostupná nová verzia aplikácie.', {
      label: 'Obnoviť',
      onClick: () => void updateServiceWorker(true),
    })
  }, [needRefresh, updateServiceWorker])
}
