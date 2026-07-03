import { describe, it, expect } from 'vitest'
import { moveConflictMessage } from './moveConflictMessages'

describe('moveConflictMessage', () => {
  it('returns a Slovak message for source-missing', () => {
    expect(moveConflictMessage('source-missing')).toBe(
      'Položku medzičasom presunul niekto iný.',
    )
  })

  it('returns a Slovak message for dest-list-missing', () => {
    expect(moveConflictMessage('dest-list-missing')).toBe(
      'Cieľový zoznam už neexistuje.',
    )
  })

  it('returns a distinct message per reason', () => {
    expect(moveConflictMessage('source-missing')).not.toBe(
      moveConflictMessage('dest-list-missing'),
    )
  })
})
