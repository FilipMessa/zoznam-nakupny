import { describe, it, expect, vi, beforeEach } from 'vitest'
import { onSnapshot } from 'firebase/firestore'
import { subscribeLists } from '@/features/lists/listApi'
import type { ShoppingList } from '@/features/lists/types'

// Same scope/rationale as itemApi.test.ts: this is not a test of
// onSnapshot reflecting real Firestore changes (see
// items.integration.test.ts's "remote change visibility" comment). It tests
// the object-reference-reuse logic added on top, so React.memo on
// AllListsSection isn't defeated whenever some *other* list changes.
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

function subscribeForTest() {
  let latest: ShoppingList[] = []
  subscribeLists((next) => {
    latest = next
  })
  return () => latest
}

describe('subscribeLists', () => {
  let capturedCallback: SnapshotCallback = () => {}

  beforeEach(() => {
    mockedOnSnapshot.mockImplementation((_query, _options, callback) => {
      capturedCallback = callback as SnapshotCallback
      return vi.fn()
    })
  })

  it('keeps the same list object reference across snapshots when it is unchanged', () => {
    const latest = subscribeForTest()
    const listA = fakeDoc('list-1', { name: 'Potraviny' })
    const listB = fakeDoc('list-2', { name: 'Drogéria' })

    capturedCallback(
      fakeSnapshot(
        [listA, listB],
        [
          { type: 'added', doc: listA },
          { type: 'added', doc: listB },
        ],
      ),
    )
    const firstListA = latest().find((list) => list.id === 'list-1')

    capturedCallback(
      fakeSnapshot([listA, listB], [{ type: 'modified', doc: listB }]),
    )
    const secondListA = latest().find((list) => list.id === 'list-1')

    expect(secondListA).toBe(firstListA)
  })

  it('gives a renamed list a new object reference', () => {
    const latest = subscribeForTest()
    const listA = fakeDoc('list-1', { name: 'Potraviny' })

    capturedCallback(fakeSnapshot([listA], [{ type: 'added', doc: listA }]))
    const firstListA = latest().find((list) => list.id === 'list-1')

    const listARenamed = fakeDoc('list-1', { name: 'Týždenný nákup' })
    capturedCallback(
      fakeSnapshot([listARenamed], [{ type: 'modified', doc: listARenamed }]),
    )
    const secondListA = latest().find((list) => list.id === 'list-1')

    expect(secondListA).not.toBe(firstListA)
    expect(secondListA?.name).toBe('Týždenný nákup')
  })

  it('does not update lists when a snapshot reports no changes', () => {
    const latest = subscribeForTest()
    const listA = fakeDoc('list-1', { name: 'Potraviny' })

    capturedCallback(fakeSnapshot([listA], [{ type: 'added', doc: listA }]))
    const firstLists = latest()

    capturedCallback(fakeSnapshot([listA], []))

    expect(latest()).toBe(firstLists)
  })
})
