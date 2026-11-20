import { useAuth } from './useAuth'

// The signed-in user's uid, for everything App renders past its sign-in
// gate (InviteCodeScreen, ListsScreen and below): App only renders those
// once `user` exists and unmounts them in the same render that clears it,
// so a missing user here is a wiring bug, not a state to handle.
export function useSignedInUid(): string {
  const { user } = useAuth()
  if (!user) {
    throw new Error('useSignedInUid must only be used below the sign-in gate')
  }
  return user.uid
}
