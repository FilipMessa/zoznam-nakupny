import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSignedInUid } from '@/features/auth/useSignedInUid'
import { useAuth } from '@/features/auth/useAuth'

vi.mock('@/features/auth/useAuth', () => ({ useAuth: vi.fn() }))

const mockedUseAuth = vi.mocked(useAuth)

describe('useSignedInUid', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("returns the signed-in user's uid", () => {
    mockedUseAuth.mockReturnValue({
      user: { uid: 'uid-1' } as never,
      authLoading: false,
    })

    const { result } = renderHook(() => useSignedInUid())

    expect(result.current).toBe('uid-1')
  })

  it('throws when used without a signed-in user', () => {
    mockedUseAuth.mockReturnValue({ user: null, authLoading: false })
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    expect(() => renderHook(() => useSignedInUid())).toThrow(
      'useSignedInUid must only be used below the sign-in gate',
    )
    consoleErrorSpy.mockRestore()
  })
})
