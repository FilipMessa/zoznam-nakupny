import './App.css'
import { useAuth } from './features/auth/useAuth'
import { useMembership } from './features/auth/useMembership'
import { LoadingScreen } from './features/auth/components/LoadingScreen'
import { SignInScreen } from './features/auth/components/SignInScreen'
import { InviteCodeScreen } from './features/auth/components/InviteCodeScreen'
import { MemberPlaceholder } from './features/auth/components/MemberPlaceholder'

function App() {
  const { user, authLoading } = useAuth()
  const { status, markAsMember } = useMembership(user?.uid ?? null)

  if (authLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <SignInScreen />
  }

  if (status === 'idle' || status === 'loading') {
    return <LoadingScreen />
  }

  if (status === 'non-member') {
    return <InviteCodeScreen markAsMember={markAsMember} />
  }

  return <MemberPlaceholder />
}

export default App
