import { describe, it, expect, vi, afterEach } from 'vitest'
import { notifyWithAction, toaster } from '@/lib/toaster'

describe('notifyWithAction', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a sticky info toast carrying the action', () => {
    const create = vi.spyOn(toaster, 'create').mockReturnValue('toast-1')
    const action = { label: 'Obnoviť', onClick: vi.fn() }

    notifyWithAction('Je dostupná nová verzia aplikácie.', action)

    expect(create).toHaveBeenCalledWith({
      description: 'Je dostupná nová verzia aplikácie.',
      type: 'info',
      duration: Infinity,
      action,
    })
  })

  it('returns a function that dismisses exactly that toast', () => {
    vi.spyOn(toaster, 'create').mockReturnValue('toast-1')
    const dismiss = vi.spyOn(toaster, 'dismiss').mockImplementation(() => {})

    const close = notifyWithAction('x', { label: 'y', onClick: () => {} })
    expect(dismiss).not.toHaveBeenCalled()
    close()

    expect(dismiss).toHaveBeenCalledWith('toast-1')
  })
})
