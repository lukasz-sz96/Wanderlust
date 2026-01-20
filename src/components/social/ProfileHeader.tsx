import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Settings } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { ProBadge } from './ProBadge';
import { FollowButton } from './FollowButton';
import { FollowersModal } from './FollowersModal';
import { Button } from '../ui/Button';
import { Id } from '../../../convex/_generated/dataModel';
import { Link } from '@tanstack/react-router';

interface ProfileHeaderProps {
  user: {
    _id: Id<'users'>;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    homeLocation?: string;
    coverPhotoUrl?: string;
    role: string;
    createdAt: number;
  };
  stats: {
    followers: number;
    following: number;
  };
  isOwnProfile: boolean;
  isFollowing: boolean;
  onFollowChange?: () => void;
}

export function ProfileHeader({
  user,
  stats,
  isOwnProfile,
  isFollowing,
  onFollowChange,
}: ProfileHeaderProps) {
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<'followers' | 'following'>('followers');

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const isPro = ['pro', 'moderator', 'admin'].includes(user.role);

  const openFollowersModal = (tab: 'followers' | 'following') => {
    setFollowersModalTab(tab);
    setShowFollowersModal(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative bg-surface rounded-xl overflow-hidden border border-border-light shadow-sm"
    >
      {/* Cover Photo */}
      <div
        className="h-36 sm:h-48 bg-gradient-to-br from-primary via-primary-light to-secondary"
        style={
          user.coverPhotoUrl
            ? {
                backgroundImage: `url(${user.coverPhotoUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {/* Decorative pattern overlay */}
        {!user.coverPhotoUrl && (
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-10 sm:-mt-12 gap-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <Avatar
              src={user.avatarUrl}
              alt={user.displayName || 'User'}
              size="xl"
              className="ring-4 ring-surface w-24 h-24 sm:w-28 sm:h-28 text-2xl"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 sm:mb-2"
          >
            {isOwnProfile ? (
              <Link to="/settings">
                <Button variant="outline" leftIcon={<Settings size={16} />}>
                  Edit Profile
                </Button>
              </Link>
            ) : (
              <FollowButton
                userId={user._id}
                isFollowing={isFollowing}
                onChange={onFollowChange}
              />
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-4"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {user.displayName || 'Traveler'}
            </h1>
            {isPro && <ProBadge size="md" />}
          </div>

          {user.bio && (
            <p className="mt-2 text-muted leading-relaxed max-w-xl">{user.bio}</p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-muted">
            {user.homeLocation && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-primary" />
                {user.homeLocation}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-secondary" />
              Joined {joinDate}
            </span>
          </div>

          <div className="flex gap-5 mt-4">
            <button
              onClick={() => openFollowersModal('followers')}
              className="group text-foreground hover:text-primary transition-colors"
            >
              <strong className="font-semibold">{stats.followers.toLocaleString()}</strong>{' '}
              <span className="text-muted group-hover:text-primary/70 transition-colors">
                followers
              </span>
            </button>
            <button
              onClick={() => openFollowersModal('following')}
              className="group text-foreground hover:text-primary transition-colors"
            >
              <strong className="font-semibold">{stats.following.toLocaleString()}</strong>{' '}
              <span className="text-muted group-hover:text-primary/70 transition-colors">
                following
              </span>
            </button>
          </div>
        </motion.div>
      </div>

      <FollowersModal
        userId={user._id}
        initialTab={followersModalTab}
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
      />
    </motion.div>
  );
}

export default ProfileHeader;
