import { motion } from 'framer-motion';
import { Avatar } from '../ui/Avatar';
import { ProBadge } from './ProBadge';
import { FollowButton } from './FollowButton';
import { Id } from '../../../convex/_generated/dataModel';
import { MapPin } from 'lucide-react';

interface UserCardProps {
  user: {
    _id: Id<'users'>;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    role: string;
    homeLocation?: string;
  };
  showFollowButton?: boolean;
  isFollowing?: boolean;
  onFollowChange?: () => void;
  animate?: boolean;
}

export function UserCard({
  user,
  showFollowButton = false,
  isFollowing = false,
  onFollowChange,
  animate = true,
}: UserCardProps) {
  const isPro = ['pro', 'moderator', 'admin'].includes(user.role);

  const content = (
    <motion.div
      initial={animate ? { opacity: 0, y: 10 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      whileHover={{ backgroundColor: 'var(--color-border-light)' }}
      className="flex items-center gap-3 p-3 rounded-xl transition-colors"
    >
      <a
        href={`/profile/${user._id}`}
        className="flex-shrink-0"
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
          <Avatar
            src={user.avatarUrl}
            alt={user.displayName || 'User'}
            size="md"
          />
        </motion.div>
      </a>

      <div className="flex-1 min-w-0">
        <a
          href={`/profile/${user._id}`}
          className="flex items-center gap-1.5 group"
        >
          <span className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {user.displayName || 'Traveler'}
          </span>
          {isPro && <ProBadge size="sm" />}
        </a>

        {user.homeLocation && (
          <p className="text-sm text-muted flex items-center gap-1 truncate mt-0.5">
            <MapPin size={12} className="flex-shrink-0 text-primary/60" />
            <span className="truncate">{user.homeLocation}</span>
          </p>
        )}

        {user.bio && !user.homeLocation && (
          <p className="text-sm text-muted truncate mt-0.5">{user.bio}</p>
        )}
      </div>

      {showFollowButton && (
        <div className="flex-shrink-0">
          <FollowButton
            userId={user._id}
            isFollowing={isFollowing}
            onChange={onFollowChange}
            size="sm"
          />
        </div>
      )}
    </motion.div>
  );

  return content;
}

// Compact variant for lists
interface UserCardCompactProps {
  user: {
    _id: Id<'users'>;
    displayName?: string;
    avatarUrl?: string;
    role: string;
  };
}

export function UserCardCompact({ user }: UserCardCompactProps) {
  const isPro = ['pro', 'moderator', 'admin'].includes(user.role);

  return (
    <a
      href={`/profile/${user._id}`}
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-border-light transition-colors group"
    >
      <Avatar
        src={user.avatarUrl}
        alt={user.displayName || 'User'}
        size="sm"
      />
      <span className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
        {user.displayName || 'Traveler'}
      </span>
      {isPro && <ProBadge size="sm" />}
    </a>
  );
}

export default UserCard;
