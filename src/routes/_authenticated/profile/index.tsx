import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { useEffect } from 'react';
import { api } from '../../../../convex/_generated/api';
import { PageLoading } from '../../../components/ui';

function ProfileIndexPage() {
  const navigate = useNavigate();
  const profile = useQuery(api.social.getProfile, {});

  useEffect(() => {
    if (profile?._id) {
      navigate({ to: '/profile/$userId', params: { userId: profile._id } });
    }
  }, [profile, navigate]);

  return <PageLoading />;
}

export const Route = createFileRoute('/_authenticated/profile/')({
  component: ProfileIndexPage,
});
