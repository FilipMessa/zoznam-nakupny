import { describe, it, expect } from 'vitest'
import { validateListName, planCascadeDelete } from './listCrud'

describe('validateListName', () => {
  it('rejects an empty string', () => {
    expect(validateListName('')).toEqual({ ok: false })
  })

  it('rejects a whitespace-only string', () => {
    expect(validateListName('   ')).toEqual({ ok: false })
  })

  it('trims and accepts a valid name', () => {
    expect(validateListName('  Groceries  ')).toEqual({
      ok: true,
      name: 'Groceries',
    })
  })

  it('accepts a name that is already trimmed', () => {
    expect(validateListName('Weekend shop')).toEqual({
      ok: true,
      name: 'Weekend shop',
    })
  })
})

describe('planCascadeDelete', () => {
  it('returns the listId and itemIds unchanged as a delete plan', () => {
    const plan = planCascadeDelete('list-1', ['item-1', 'item-2', 'item-3'])

    expect(plan).toEqual({
      listId: 'list-1',
      itemIds: ['item-1', 'item-2', 'item-3'],
    })
  })

  it('supports an empty itemIds array (list with no items)', () => {
    const plan = planCascadeDelete('list-1', [])

    expect(plan).toEqual({ listId: 'list-1', itemIds: [] })
  })
})
