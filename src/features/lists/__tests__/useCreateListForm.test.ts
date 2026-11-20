import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCreateListForm } from '@/features/lists/useCreateListForm'
import * as listApi from '@/features/lists/listApi'
import { useOnlineStatus } from '@/lib/useOnlineStatus'

vi.mock('@/features/lists/listApi', () => ({
  createList: vi.fn(),
  generateListId: vi.fn(),
}))
vi.mock('@/lib/useOnlineStatus', () => ({ useOnlineStatus: vi.fn() }))

const mockedCreateList = vi.mocked(listApi.createList)
const mockedGenerateListId = vi.mocked(listApi.generateListId)
const mockedUseOnlineStatus = vi.mocked(useOnlineStatus)

describe('useCreateListForm', () => {
  beforeEach(() => {
    mockedUseOnlineStatus.mockReturnValue(true)
    mockedGenerateListId.mockReturnValue('list-new')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  function setup(onCreated?: (listId: string) => void) {
    const hook = renderHook(() =>
      useCreateListForm({ uid: 'uid-1', onCreated }),
    )
    act(() => hook.result.current.openCreateForm())
    return hook
  }

  describe('online', () => {
    it('awaits the write, then reports the minted id and closes the form', async () => {
      let resolveWrite: () => void = () => {}
      mockedCreateList.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveWrite = resolve
        }),
      )
      const onCreated = vi.fn()
      const { result } = setup(onCreated)

      let submit: Promise<void> = Promise.resolve()
      act(() => {
        submit = result.current.handleCreate('  Víkend ')
      })

      expect(mockedCreateList).toHaveBeenCalledWith(
        'Víkend',
        'uid-1',
        'list-new',
      )
      expect(result.current.createPending).toBe(true)
      expect(result.current.showCreateForm).toBe(true)
      expect(onCreated).not.toHaveBeenCalled()

      await act(async () => {
        resolveWrite()
        await submit
      })

      expect(onCreated).toHaveBeenCalledWith('list-new')
      expect(result.current.showCreateForm).toBe(false)
      expect(result.current.createPending).toBe(false)
      expect(result.current.createError).toBeNull()
    })

    it('keeps the form open and reports an error when the write fails', async () => {
      mockedCreateList.mockRejectedValue(new Error('boom'))
      const onCreated = vi.fn()
      const { result } = setup(onCreated)

      await act(() => result.current.handleCreate('Víkend'))

      expect(result.current.createError).toBe('unknown')
      expect(result.current.showCreateForm).toBe(true)
      expect(result.current.createPending).toBe(false)
      expect(onCreated).not.toHaveBeenCalled()
    })

    it('works without an onCreated callback', async () => {
      mockedCreateList.mockResolvedValue()
      const { result } = setup()

      await act(() => result.current.handleCreate('Víkend'))

      expect(result.current.showCreateForm).toBe(false)
    })
  })

  describe('offline', () => {
    beforeEach(() => {
      mockedUseOnlineStatus.mockReturnValue(false)
    })

    it('closes the form and reports the id without waiting for the write', async () => {
      mockedCreateList.mockReturnValue(new Promise<void>(() => {}))
      const onCreated = vi.fn()
      const { result } = setup(onCreated)

      await act(() => result.current.handleCreate('Víkend'))

      expect(mockedCreateList).toHaveBeenCalledWith(
        'Víkend',
        'uid-1',
        'list-new',
      )
      expect(onCreated).toHaveBeenCalledWith('list-new')
      expect(result.current.showCreateForm).toBe(false)
      expect(result.current.createPending).toBe(false)
    })

    it('swallows a late write failure after the form is closed', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      mockedCreateList.mockRejectedValue(new Error('boom'))
      const { result } = setup()

      await act(() => result.current.handleCreate('Víkend'))

      expect(result.current.createError).toBeNull()
      expect(result.current.showCreateForm).toBe(false)
      expect(consoleError).toHaveBeenCalled()
      consoleError.mockRestore()
    })
  })

  it('rejects a blank name without writing', async () => {
    const onCreated = vi.fn()
    const { result } = setup(onCreated)

    await act(() => result.current.handleCreate('   '))

    expect(result.current.createError).toBe('invalid-name')
    expect(mockedCreateList).not.toHaveBeenCalled()
    expect(onCreated).not.toHaveBeenCalled()
    expect(result.current.showCreateForm).toBe(true)
  })
})
