import { describe, it, expect } from 'vitest'
import { validateListName } from '@/features/lists/listService'

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
