import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { AlertTriangle, Home, Compass } from 'lucide-react';
import appCssUrl from '../app.css?url';
import { getToken } from '../lib/auth-server';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { ConvexReactClient } from 'convex/react';
import type { ConvexQueryClient } from '@convex-dev/react-query';

const fetchAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const token = await getToken();
  return { token };
});

const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('wanderlust-theme') || 'system';
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {}
  })();
`;

const RootDocument = ({ children }: Readonly<{ children: ReactNode }>) => (
  <html lang="en" data-theme="system" suppressHydrationWarning>
    <head>
      <HeadContent />
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
    </head>
    <body suppressHydrationWarning>
      {children}
      <Scripts />
    </body>
  </html>
);

const RootComponent = () => (
  <RootDocument>
    <Outlet />
  </RootDocument>
);

const NotFoundPage = () => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <div className="text-center">
      <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
        <Compass className="text-accent-hover" size={40} />
      </div>
      <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
      <p className="text-xl text-muted mb-6">Page not found</p>
      <p className="text-muted mb-8 max-w-md">Looks like you've wandered off the map. Let's get you back on track.</p>
      <a
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors"
      >
        <Home size={18} />
        Go Home
      </a>
    </div>
  </div>
);

const ErrorPage = ({ error }: { error: Error }) => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <div className="text-center">
      <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="text-error" size={40} />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
      <p className="text-muted mb-6 max-w-md">{error.message || 'An unexpected error occurred'}</p>
      <a
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors"
      >
        <Home size={18} />
        Go Home
      </a>
    </div>
  </div>
);

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Wanderlust - Travel Planning',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCssUrl },
      { rel: 'icon', href: '/convex.svg' },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
  beforeLoad: async (ctx) => {
    const { token } = await fetchAuth();

    // During SSR only (the only time serverHttpClient exists),
    // set the auth token to make HTTP queries with.
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    }

    return { token, isAuthenticated: !!token };
  },
});
