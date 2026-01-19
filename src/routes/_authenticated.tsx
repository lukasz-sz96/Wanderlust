import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getToken } from '../lib/auth-server';
import { useUserSync } from '../lib/hooks/useUserSync';
import { AppShell } from '../components/layout';

const checkAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const token = await getToken();
  return { isAuthenticated: !!token };
});

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { isAuthenticated } = await checkAuth();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  useUserSync();

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
