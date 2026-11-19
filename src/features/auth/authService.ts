const POPUP_FALLBACK_ERROR_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
])

export function isLikelyMobileBrowser(
  userAgent: string,
  maxTouchPoints: number,
): boolean {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent,
    ) ||
    (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)
  )
}

export function isPopupFallbackError(error: unknown): boolean {
  const code = (error as { code?: string } | undefined)?.code
  return Boolean(code && POPUP_FALLBACK_ERROR_CODES.has(code))
}
