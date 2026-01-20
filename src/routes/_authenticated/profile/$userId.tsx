import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { motion } from 'framer-motion';
import { UserCircle } from 'lucide-react';
import { api } from '../../../../convex/_generated/api';
import {
  AnimatedPage,
  Card,
  CardContent,
  PageLoading,
} from '../../../components/ui';
import { ProfileHeader } from '../../../components/social/ProfileHeader';
import { TravelStatsCard } from '../../../components/social/TravelStatsCard';
import type { Id } from '../../../../convex/_generated/dataModel';

function ProfilePage() {
  const { userId } = Route.useParams();
  const profile = useQuery(api.social.getProfile, {
    userId: userId as Id<'users'>,
  });

  if (profile === undefined) {
    return <PageLoading />;
  }

  if (profile === null) {
    return (
      <AnimatedPage>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center mb-4">
              <UserCircle size={40} className="text-muted" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Profile not found
            </h2>
            <p className="text-muted max-w-sm">
              This user doesn't exist or their profile is private
            </p>
          </motion.div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
        <Card padding="none">
          <ProfileHeader
            user={{
              _id: profile._id,
              displayName: profile.displayName,
              avatarUrl: profile.avatarUrl,
              bio: profile.bio,
              homeLocation: profile.homeLocation,
              coverPhotoUrl: profile.coverPhotoUrl,
              role: profile.role || 'free',
              createdAt: profile.createdAt,
            }}
            stats={{
              followers: profile.stats.followers,
              following: profile.stats.following,
            }}
            isOwnProfile={profile.isOwnProfile}
            isFollowing={profile.isFollowing}
          />
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Travel Stats
            </h2>
            <TravelStatsCard stats={profile.stats} />
          </CardContent>
        </Card>

        {profile.travelStyles && profile.travelStyles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Travel Styles
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.travelStyles.map((style) => (
                    <span
                      key={style}
                      className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                    >
                      {style}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {profile.languages && profile.languages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Languages
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((lang) => (
                    <span
                      key={lang}
                      className="px-3 py-1.5 bg-secondary/10 text-secondary rounded-full text-sm font-medium"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AnimatedPage>
  );
}

export const Route = createFileRoute('/_authenticated/profile/$userId')({
  component: ProfilePage,
});
