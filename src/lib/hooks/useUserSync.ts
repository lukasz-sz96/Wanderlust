import { useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { authClient } from '../auth-client';

/**
 * Hook to sync BetterAuth user to Convex database.
 * Should be called in the authenticated layout to ensure user exists in Convex.
 */
export function useUserSync() {
  const { data: session, isPending } = authClient.useSession();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const syncedRef = useRef(false);

  useEffect(() => {
    // Only sync once per session and when we have user data
    if (isPending || !session?.user || syncedRef.current) {
      return;
    }

    const syncUser = async () => {
      try {
        await getOrCreateUser({
          authUserId: session.user.id,
          email: session.user.email,
          displayName: session.user.name || undefined,
          avatarUrl: session.user.image || undefined,
        });
        syncedRef.current = true;
      } catch (error) {
        console.error('Failed to sync user:', error);
      }
    };

    syncUser();
  }, [session, isPending, getOrCreateUser]);
}

/**
 * Hook to get the current Convex user.
 * Returns the user object or null if not authenticated/synced.
 */
export function useCurrentUser() {
  const currentUser = useQuery(api.users.getCurrentUser);
  return currentUser;
}
