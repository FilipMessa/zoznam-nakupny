import { signOutUser } from './authApi'

export interface UseSignOutResult {
  handleSignOut: () => void
}

export function useSignOut(): UseSignOutResult {
  const handleSignOut = () => {
    void signOutUser()
  }

  return { handleSignOut }
}
