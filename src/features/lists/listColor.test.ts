import { describe, it, expect } from 'vitest'
import { listColorFor, LIST_COLOR_PALETTE } from './listColor'

describe('listColorFor', () => {
  it('returns the same color for the same list id every time', () => {
    const first = listColorFor('list-abc')
    const second = listColorFor('list-abc')

    expect(second).toEqual(first)
  })

  it('returns a token pair from the fixed palette', () => {
    const color = listColorFor('list-xyz')
    const hue = color.solid.split('.')[0]

    expect(LIST_COLOR_PALETTE).toContain(hue)
    expect(color).toEqual({ solid: `${hue}.solid`, subtle: `${hue}.subtle` })
  })

  it('spreads different ids across more than one palette color', () => {
    const ids = ['list-a', 'list-b', 'list-c', 'list-d', 'list-e', 'list-f']
    const colors = new Set(ids.map((id) => listColorFor(id).solid))

    expect(colors.size).toBeGreaterThan(1)
  })
})
