import { describe, it, expect } from 'vitest'
import { createSnapshotMapper, type SnapshotLike } from '@/lib/snapshotMapper'

interface Thing {
  id: string
  label: string
  pendingSync?: boolean
}

type Change = ReturnType<SnapshotLike['docChanges']>[number]

function fakeDoc(id: string, label: string, hasPendingWrites = false) {
  return { id, data: () => ({ label }), metadata: { hasPendingWrites } }
}

function snapshot(docs: { id: string }[], changes: Change[]): SnapshotLike {
  return { docs, docChanges: () => changes }
}

describe('createSnapshotMapper', () => {
  it('maps added docs to objects with id, data and pendingSync', () => {
    const map = createSnapshotMapper<Thing>()
    const a = fakeDoc('a', 'A', true)

    expect(map(snapshot([a], [{ type: 'added', doc: a }]))).toEqual([
      { id: 'a', label: 'A', pendingSync: true },
    ])
  })

  it('returns [] for an empty first snapshot', () => {
    const map = createSnapshotMapper<Thing>()

    expect(map(snapshot([], []))).toEqual([])
  })

  it('keeps the object reference of docs that did not change', () => {
    const map = createSnapshotMapper<Thing>()
    const a = fakeDoc('a', 'A')
    const b = fakeDoc('b', 'B')
    const first = map(
      snapshot(
        [a, b],
        [
          { type: 'added', doc: a },
          { type: 'added', doc: b },
        ],
      ),
    )

    const second = map(snapshot([a, b], [{ type: 'modified', doc: b }]))

    expect(second[0]).toBe(first[0])
    expect(second[1]).not.toBe(first[1])
  })

  it('re-emits the same array when nothing changed', () => {
    const map = createSnapshotMapper<Thing>()
    const a = fakeDoc('a', 'A')
    const first = map(snapshot([a], [{ type: 'added', doc: a }]))

    expect(map(snapshot([a], []))).toBe(first)
  })

  it('drops removed docs and follows the snapshot order', () => {
    const map = createSnapshotMapper<Thing>()
    const a = fakeDoc('a', 'A')
    const b = fakeDoc('b', 'B')
    map(
      snapshot(
        [a, b],
        [
          { type: 'added', doc: a },
          { type: 'added', doc: b },
        ],
      ),
    )

    const next = map(snapshot([b], [{ type: 'removed', doc: a }]))

    expect(next.map((thing) => thing.id)).toEqual(['b'])
  })
})
