import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOnlineStatus } from '@/lib/useOnlineStatus'

describe('useOnlineStatus', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns navigator.onLine as the initial value', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)

    const { result } = renderHook(() => useOnlineStatus())

    expect(result.current).toBe(true)
  })

  it('flips to false when the offline event fires', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)

    const { result } = renderHook(() => useOnlineStatus())

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current).toBe(false)
  })

  it('flips back to true when the online event fires', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)

    const { result } = renderHook(() => useOnlineStatus())

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(result.current).toBe(true)
  })
})
