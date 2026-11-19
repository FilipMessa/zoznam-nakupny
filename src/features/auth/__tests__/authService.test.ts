import { describe, expect, it } from 'vitest'
import {
  isLikelyMobileBrowser,
  isPopupFallbackError,
} from '@/features/auth/authService'

const DESKTOP_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36'
const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/120 Mobile/15E148 Safari/604.1'

describe('isLikelyMobileBrowser', () => {
  it('treats a desktop Mac without touch as desktop', () => {
    expect(isLikelyMobileBrowser(DESKTOP_MAC, 0)).toBe(false)
  })

  it('detects phone user agents', () => {
    expect(isLikelyMobileBrowser(IPHONE, 5)).toBe(true)
    expect(isLikelyMobileBrowser('Mozilla/5.0 (Linux; Android 14)', 5)).toBe(
      true,
    )
  })

  it('detects iPadOS, which reports a Macintosh user agent with touch points', () => {
    expect(isLikelyMobileBrowser(DESKTOP_MAC, 5)).toBe(true)
  })
})

describe('isPopupFallbackError', () => {
  it('is true for popup-unavailable error codes', () => {
    expect(isPopupFallbackError({ code: 'auth/popup-blocked' })).toBe(true)
    expect(
      isPopupFallbackError({
        code: 'auth/operation-not-supported-in-this-environment',
      }),
    ).toBe(true)
  })

  it('is false for other errors', () => {
    expect(isPopupFallbackError({ code: 'auth/popup-closed-by-user' })).toBe(
      false,
    )
    expect(isPopupFallbackError(undefined)).toBe(false)
    expect(isPopupFallbackError(new Error('boom'))).toBe(false)
  })
})
