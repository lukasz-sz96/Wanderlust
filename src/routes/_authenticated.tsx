import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { getAuth, getSignInUrl } from '@workos/authkit-tanstack-react-start';
import { useUserSync } from '../lib/hooks/useUserSync';
import { AppShell } from '../components/layout';

export const Route = createFileRoute('/_authenticated')({
  loader: async ({ location }) => {
    const { user } = await getAuth();
    if (!user) {
      const path = location.pathname;
      const href = await getSignInUrl({ data: { returnPathname: path } });
      throw redirect({ href });
    }
  },
  component: AuthenticatedLayout,
});

const AuthenticatedLayout = () => {
  useUserSync();

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
};
