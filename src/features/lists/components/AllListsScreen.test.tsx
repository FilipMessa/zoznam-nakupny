import { describe, it, expect, vi, afterEach } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import { render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { AllListsScreen } from './AllListsScreen'
import type { ShoppingList } from '../types'

// AllListsSection has its own suite (mounts useAuth/useItems for a real
// list); stub it here so this suite only exercises the screen shell
// (header, back button, one section per list).
vi.mock('./AllListsSection', () => ({
  AllListsSection: ({ list }: { list: ShoppingList }) => (
    <div data-testid={`all-lists-section-${list.id}`}>{list.name}</div>
  ),
}))

function fakeTimestamp(millis: number): Timestamp {
  return { toMillis: () => millis } as unknown as Timestamp
}

function makeList(overrides: Partial<ShoppingList> = {}): ShoppingList {
  return {
    id: 'list-1',
    name: 'Potraviny',
    createdAt: fakeTimestamp(0),
    createdBy: 'uid-1',
    ...overrides,
  }
}

describe('AllListsScreen', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders one section per list', () => {
    render(
      <AllListsScreen
        lists={[
          makeList({ id: 'list-1', name: 'Potraviny' }),
          makeList({ id: 'list-2', name: 'Drogéria' }),
        ]}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByTestId('all-lists-section-list-1')).toHaveTextContent(
      'Potraviny',
    )
    expect(screen.getByTestId('all-lists-section-list-2')).toHaveTextContent(
      'Drogéria',
    )
  })

  it('calls onClose when the back button is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<AllListsScreen lists={[makeList()]} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Späť' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows the screen title', () => {
    render(<AllListsScreen lists={[makeList()]} onClose={vi.fn()} />)

    expect(screen.getByText('Všetky zoznamy')).toBeInTheDocument()
  })
})
