import { useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useAuth } from '@workos/authkit-tanstack-react-start/client';
import { api } from '../../../convex/_generated/api';

/**
 * Hook to sync WorkOS user to Convex database.
 * Should be called in the authenticated layout to ensure user exists in Convex.
 */
export function useUserSync() {
  const { user, loading } = useAuth();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const syncedRef = useRef(false);

  useEffect(() => {
    // Only sync once per session and when we have user data
    if (loading || !user || syncedRef.current) {
      return;
    }

    const syncUser = async () => {
      try {
        await getOrCreateUser({
          workosUserId: user.id,
          email: user.email,
          displayName:
            user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.firstName || undefined,
          avatarUrl: user.profilePictureUrl || undefined,
        });
        syncedRef.current = true;
      } catch (error) {
        console.error('Failed to sync user:', error);
      }
    };

    syncUser();
  }, [user, loading, getOrCreateUser]);
}

/**
 * Hook to get the current Convex user.
 * Returns the user object or null if not authenticated/synced.
 */
export function useCurrentUser() {
  const currentUser = useQuery(api.users.getCurrentUser);
  return currentUser;
}
