import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const { useRegisterSW, notifyWithAction, dismiss } = vi.hoisted(() => ({
  useRegisterSW: vi.fn(),
  notifyWithAction: vi.fn(),
  dismiss: vi.fn(),
}))

vi.mock('virtual:pwa-register/react', () => ({ useRegisterSW }))
vi.mock('@/lib/toaster', () => ({ notifyWithAction }))

import { useServiceWorkerUpdate } from '@/lib/useServiceWorkerUpdate'

type RegisterOptions = {
  onRegisteredSW: (
    swUrl: string,
    registration: ServiceWorkerRegistration | undefined,
  ) => void
}

function mockRegisterSW(needRefresh: boolean) {
  const updateServiceWorker = vi.fn().mockResolvedValue(undefined)
  useRegisterSW.mockReturnValue({
    needRefresh: [needRefresh, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker,
  })
  return updateServiceWorker
}

describe('useServiceWorkerUpdate', () => {
  beforeEach(() => {
    notifyWithAction.mockReturnValue(dismiss)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('shows no prompt while no new version is waiting', () => {
    mockRegisterSW(false)

    renderHook(() => useServiceWorkerUpdate())

    expect(notifyWithAction).not.toHaveBeenCalled()
  })

  it('prompts once a new version is waiting and reloads into it on "Obnoviť"', () => {
    const updateServiceWorker = mockRegisterSW(true)

    renderHook(() => useServiceWorkerUpdate())

    expect(notifyWithAction).toHaveBeenCalledTimes(1)
    const [, action] = notifyWithAction.mock.calls[0]
    expect(action.label).toBe('Obnoviť')
    action.onClick()
    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('dismisses the prompt on unmount', () => {
    mockRegisterSW(true)

    const { unmount } = renderHook(() => useServiceWorkerUpdate())
    unmount()

    expect(dismiss).toHaveBeenCalled()
  })

  it('checks for a new version hourly, but only while online', () => {
    vi.useFakeTimers()
    mockRegisterSW(false)
    renderHook(() => useServiceWorkerUpdate())
    const { onRegisteredSW } = useRegisterSW.mock.calls[0][0] as RegisterOptions
    const registration = {
      update: vi.fn().mockResolvedValue(undefined),
    } as unknown as ServiceWorkerRegistration
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)

    onRegisteredSW('/sw.js', registration)
    vi.advanceTimersByTime(60 * 60 * 1000)
    expect(registration.update).toHaveBeenCalledTimes(1)

    onLine.mockReturnValue(false)
    vi.advanceTimersByTime(60 * 60 * 1000)
    expect(registration.update).toHaveBeenCalledTimes(1)
  })
})
