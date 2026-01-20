import { createAuthClient } from 'better-auth/react';
import { convexClient } from '@convex-dev/better-auth/client/plugins';

export const authClient = createAuthClient({
  // Use same origin - requests are proxied through TanStack Start server
  plugins: [convexClient()],
});

// Export commonly used hooks and methods
export const { signIn, signUp, signOut, useSession } = authClient;
