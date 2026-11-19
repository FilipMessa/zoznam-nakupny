import { describe, it, expect, vi, beforeEach } from 'vitest'
import { onSnapshot } from 'firebase/firestore'
import { subscribeItems } from '@/features/items/itemApi'
import type { ShoppingItem } from '@/features/items/types'

// This suite is deliberately narrow: it does not test that onSnapshot
// wiring reflects real Firestore changes (see items.integration.test.ts's
// "remote change visibility" comment -- that's covered by manual/e2e
// verification instead). It tests one specific piece of logic added on top
// of onSnapshot (in subscribeItems): reusing a document's object reference
// across snapshots when docChanges() says it didn't change, so React.memo
// further down the tree (AllListsSection/ActiveItemRow) can actually skip
// unrelated rows.
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
  let latest: ShoppingItem[] = []
  subscribeItems('list-1', (next) => {
    latest = next
  })
  return () => latest
}

describe('subscribeItems', () => {
  let capturedCallback: SnapshotCallback = () => {}

  beforeEach(() => {
    mockedOnSnapshot.mockImplementation((_query, _options, callback) => {
      capturedCallback = callback as SnapshotCallback
      return vi.fn()
    })
  })

  it('keeps the same item object reference across snapshots when the document is unchanged', () => {
    const latest = subscribeForTest()
    const docA = fakeDoc('a', { text: 'mlieko', status: 'active' })
    const docB = fakeDoc('b', { text: 'chlieb', status: 'active' })

    capturedCallback(
      fakeSnapshot(
        [docA, docB],
        [
          { type: 'added', doc: docA },
          { type: 'added', doc: docB },
        ],
      ),
    )
    const firstItemA = latest().find((item) => item.id === 'a')

    capturedCallback(
      fakeSnapshot([docA, docB], [{ type: 'modified', doc: docB }]),
    )
    const secondItemA = latest().find((item) => item.id === 'a')

    expect(secondItemA).toBe(firstItemA)
  })

  it('gives a changed document a new object reference', () => {
    const latest = subscribeForTest()
    const docA = fakeDoc('a', { text: 'mlieko', status: 'active' })

    capturedCallback(fakeSnapshot([docA], [{ type: 'added', doc: docA }]))
    const firstItemA = latest().find((item) => item.id === 'a')

    const docAUpdated = fakeDoc('a', { text: 'mlieko', status: 'done' })
    capturedCallback(
      fakeSnapshot([docAUpdated], [{ type: 'modified', doc: docAUpdated }]),
    )
    const secondItemA = latest().find((item) => item.id === 'a')

    expect(secondItemA).not.toBe(firstItemA)
    expect(secondItemA?.status).toBe('done')
  })

  it('removes a document from the returned items once docChanges reports it removed', () => {
    const latest = subscribeForTest()
    const docA = fakeDoc('a', { text: 'mlieko', status: 'active' })

    capturedCallback(fakeSnapshot([docA], [{ type: 'added', doc: docA }]))
    expect(latest().map((item) => item.id)).toEqual(['a'])

    capturedCallback(fakeSnapshot([], [{ type: 'removed', doc: docA }]))

    expect(latest()).toEqual([])
  })

  it('does not update items when a snapshot reports no changes', () => {
    const latest = subscribeForTest()
    const docA = fakeDoc('a', { text: 'mlieko', status: 'active' })

    capturedCallback(fakeSnapshot([docA], [{ type: 'added', doc: docA }]))
    const firstItems = latest()

    capturedCallback(fakeSnapshot([docA], []))

    expect(latest()).toBe(firstItems)
  })

  // Regression pin: the old useItems ignored a snapshot with no docChanges,
  // so switching from a non-empty list to an empty one (ShoppingListScreen
  // has no key) never cleared the previous list's items from state.
  // subscribeItems always emits, so a new list's first empty snapshot
  // delivers [] and replaces whatever the screen was showing.
  it('emits [] for a first snapshot that has no documents and no changes', () => {
    const onNext = vi.fn()
    subscribeItems('list-1', onNext)

    capturedCallback(fakeSnapshot([], []))

    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onNext).toHaveBeenCalledWith([])
  })

  it('re-emits the same array reference for a no-change (metadata-only) snapshot', () => {
    const onNext = vi.fn<(items: ShoppingItem[]) => void>()
    subscribeItems('list-1', onNext)
    const docA = fakeDoc('a', { text: 'mlieko', status: 'active' })

    capturedCallback(fakeSnapshot([docA], [{ type: 'added', doc: docA }]))
    capturedCallback(fakeSnapshot([docA], []))

    expect(onNext).toHaveBeenCalledTimes(2)
    expect(onNext.mock.calls[1][0]).toBe(onNext.mock.calls[0][0])
  })
})
