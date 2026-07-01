import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSelectedListId } from './useSelectedListId'
import { SELECTED_LIST_STORAGE_KEY } from '../../constants/storage'
import type { ShoppingList } from './types'

function makeList(id: string, createdAtMillis: number): ShoppingList {
  return {
    id,
    name: `List ${id}`,
    createdAt: { toMillis: () => createdAtMillis } as never,
    createdBy: 'someone',
  }
}

const listA = makeList('list-a', 1)
const listB = makeList('list-b', 2)
const listC = makeList('list-c', 3)

describe('useSelectedListId', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('uses the persisted id when it matches an existing list', () => {
    window.localStorage.setItem(SELECTED_LIST_STORAGE_KEY, 'list-b')

    const { result } = renderHook(() =>
      useSelectedListId([listA, listB, listC]),
    )

    expect(result.current.selectedListId).toBe('list-b')
  })

  it('falls back to the first list (by createdAt order) when the persisted id is missing', () => {
    const { result } = renderHook(() =>
      useSelectedListId([listA, listB, listC]),
    )

    expect(result.current.selectedListId).toBe('list-a')
  })

  it('falls back to the first list when the persisted id no longer exists', () => {
    window.localStorage.setItem(SELECTED_LIST_STORAGE_KEY, 'deleted-list')

    const { result } = renderHook(() =>
      useSelectedListId([listA, listB, listC]),
    )

    expect(result.current.selectedListId).toBe('list-a')
  })

  it('returns null when there are no lists', () => {
    const { result } = renderHook(() => useSelectedListId([]))

    expect(result.current.selectedListId).toBeNull()
  })

  it('updates selection and persists to localStorage via selectList', () => {
    const { result } = renderHook(() =>
      useSelectedListId([listA, listB, listC]),
    )

    act(() => {
      result.current.selectList('list-c')
    })

    expect(result.current.selectedListId).toBe('list-c')
    expect(window.localStorage.getItem(SELECTED_LIST_STORAGE_KEY)).toBe(
      'list-c',
    )
  })

  it('degrades gracefully when localStorage.getItem throws (private-mode simulation)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: private mode')
    })

    const { result } = renderHook(() =>
      useSelectedListId([listA, listB, listC]),
    )

    expect(result.current.selectedListId).toBe('list-a')
  })

  it('degrades gracefully when localStorage.setItem throws during selectList', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    const { result } = renderHook(() =>
      useSelectedListId([listA, listB, listC]),
    )

    expect(() => {
      act(() => {
        result.current.selectList('list-b')
      })
    }).not.toThrow()

    expect(result.current.selectedListId).toBe('list-b')
  })
})
