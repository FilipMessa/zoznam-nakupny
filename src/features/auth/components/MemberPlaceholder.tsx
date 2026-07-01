import { useAuth } from '../useAuth'
import { signOutUser } from '../googleAuth'

export function MemberPlaceholder() {
  const { user } = useAuth()
  const label = user?.displayName || user?.email || 'member'

  return (
    <div>
      <p>Welcome, {label}!</p>
      <button type="button" onClick={() => void signOutUser()}>
        Sign out
      </button>
    </div>
  )
}
