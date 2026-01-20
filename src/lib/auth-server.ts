import { convexBetterAuthReactStart } from '@convex-dev/better-auth/react-start';

// Lazy initialization to avoid running on client
let _authUtils: ReturnType<typeof convexBetterAuthReactStart> | null = null;

function getAuthUtils() {
  if (!_authUtils) {
    // Use CONVEX_URL for server-side (Docker internal network), fallback to VITE_CONVEX_URL
    const convexUrl = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
    if (!convexUrl) {
      throw new Error('CONVEX_URL or VITE_CONVEX_URL must be set');
    }
    _authUtils = convexBetterAuthReactStart({
      convexUrl,
      convexSiteUrl: process.env.CONVEX_SITE_URL!,
    });
  }
  return _authUtils;
}

export const getToken = async () => {
  return getAuthUtils().getToken();
};

export const fetchAuthQuery = async (
  ...args: Parameters<ReturnType<typeof convexBetterAuthReactStart>['fetchAuthQuery']>
) => {
  return getAuthUtils().fetchAuthQuery(...args);
};

export const fetchAuthMutation = async (
  ...args: Parameters<ReturnType<typeof convexBetterAuthReactStart>['fetchAuthMutation']>
) => {
  return getAuthUtils().fetchAuthMutation(...args);
};

export const fetchAuthAction = async (
  ...args: Parameters<ReturnType<typeof convexBetterAuthReactStart>['fetchAuthAction']>
) => {
  return getAuthUtils().fetchAuthAction(...args);
};

export const handler = (...args: Parameters<ReturnType<typeof convexBetterAuthReactStart>['handler']>) => {
  return getAuthUtils().handler(...args);
};
