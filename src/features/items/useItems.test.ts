import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { onSnapshot } from 'firebase/firestore'
import { useItems } from './useItems'

// This suite is deliberately narrow: it does not test that onSnapshot
// wiring reflects real Firestore changes (see items.integration.test.ts's
// "remote change visibility" comment -- that's covered by manual/e2e
// verification instead). It tests one specific piece of logic added on top
// of onSnapshot: reusing a document's object reference across snapshots
// when docChanges() says it didn't change, so React.memo further down the
// tree (AllListsSection/ActiveItemRow) can actually skip unrelated rows.
vi.mock('@/lib/firebase', () => ({ db: {} }))
vi.mock('@/constants/family', () => ({ FAMILY_ID: 'family-1' }))
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
}))

const mockedOnSnapshot = vi.mocked(onSnapshot)

type FakeDoc = ReturnType<typeof fakeDoc>
type SnapshotCallback = (snapshot: {
  docs: FakeDoc[]
  docChanges: () => { type: 'added' | 'modified' | 'removed'; doc: FakeDoc }[]
}) => void

function fakeDoc(
  id: string,
  data: Record<string, unknown>,
  hasPendingWrites = false,
) {
  return {
    id,
    data: () => data,
    metadata: { hasPendingWrites },
  }
}

function fakeSnapshot(
  docs: FakeDoc[],
  changes: { type: 'added' | 'modified' | 'removed'; doc: FakeDoc }[],
) {
  return { docs, docChanges: () => changes }
}

describe('useItems', () => {
  let capturedCallback: SnapshotCallback = () => {}

  beforeEach(() => {
    mockedOnSnapshot.mockImplementation((_query, _options, callback) => {
      capturedCallback = callback as SnapshotCallback
      return vi.fn()
    })
  })

  it('keeps the same item object reference across snapshots when the document is unchanged', () => {
    const { result } = renderHook(() => useItems('list-1'))
    const docA = fakeDoc('a', { text: 'mlieko', status: 'active' })
    const docB = fakeDoc('b', { text: 'chlieb', status: 'active' })

    act(() => {
      capturedCallback(
        fakeSnapshot(
          [docA, docB],
          [
            { type: 'added', doc: docA },
            { type: 'added', doc: docB },
          ],
        ),
      )
    })
    const firstItemA = result.current.items.find((item) => item.id === 'a')

    act(() => {
      capturedCallback(
        fakeSnapshot([docA, docB], [{ type: 'modified', doc: docB }]),
      )
    })
    const secondItemA = result.current.items.find((item) => item.id === 'a')

    expect(secondItemA).toBe(firstItemA)
  })

  it('gives a changed document a new object reference', () => {
    const { result } = renderHook(() => useItems('list-1'))
    const docA = fakeDoc('a', { text: 'mlieko', status: 'active' })

    act(() => {
      capturedCallback(fakeSnapshot([docA], [{ type: 'added', doc: docA }]))
    })
    const firstItemA = result.current.items.find((item) => item.id === 'a')

    const docAUpdated = fakeDoc('a', { text: 'mlieko', status: 'done' })
    act(() => {
      capturedCallback(
        fakeSnapshot([docAUpdated], [{ type: 'modified', doc: docAUpdated }]),
      )
    })
    const secondItemA = result.current.items.find((item) => item.id === 'a')

    expect(secondItemA).not.toBe(firstItemA)
    expect(secondItemA?.status).toBe('done')
  })

  it('removes a document from the returned items once docChanges reports it removed', () => {
    const { result } = renderHook(() => useItems('list-1'))
    const docA = fakeDoc('a', { text: 'mlieko', status: 'active' })

    act(() => {
      capturedCallback(fakeSnapshot([docA], [{ type: 'added', doc: docA }]))
    })
    expect(result.current.items.map((item) => item.id)).toEqual(['a'])

    act(() => {
      capturedCallback(fakeSnapshot([], [{ type: 'removed', doc: docA }]))
    })

    expect(result.current.items).toEqual([])
  })

  it('does not update items when a snapshot reports no changes', () => {
    const { result } = renderHook(() => useItems('list-1'))
    const docA = fakeDoc('a', { text: 'mlieko', status: 'active' })

    act(() => {
      capturedCallback(fakeSnapshot([docA], [{ type: 'added', doc: docA }]))
    })
    const firstItems = result.current.items

    act(() => {
      capturedCallback(fakeSnapshot([docA], []))
    })

    expect(result.current.items).toBe(firstItems)
  })
})
