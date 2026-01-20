import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';

interface FollowButtonProps {
  userId: Id<'users'>;
  isFollowing: boolean;
  onChange?: () => void;
  size?: 'sm' | 'md';
}

export function FollowButton({
  userId,
  isFollowing,
  onChange,
  size = 'md'
}: FollowButtonProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [optimisticFollowing, setOptimisticFollowing] = useState(isFollowing);

  const follow = useMutation(api.social.follow);
  const unfollow = useMutation(api.social.unfollow);

  const actualFollowing = isLoading ? optimisticFollowing : isFollowing;

  const handleClick = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setOptimisticFollowing(!isFollowing);

    try {
      if (isFollowing) {
        await unfollow({ userId });
      } else {
        await follow({ userId });
      }
      onChange?.();
    } catch (error) {
      setOptimisticFollowing(isFollowing);
      console.error('Follow action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
  };

  const iconSize = size === 'sm' ? 14 : 16;

  if (isLoading) {
    return (
      <motion.button
        disabled
        className={`
          inline-flex items-center justify-center font-medium
          rounded-lg border-2 border-border bg-border-light
          text-muted cursor-wait
          ${sizeStyles[size]}
        `}
      >
        <Loader2 size={iconSize} className="animate-spin" />
        <span>{optimisticFollowing ? 'Following' : 'Follow'}</span>
      </motion.button>
    );
  }

  if (actualFollowing) {
    return (
      <motion.button
        whileTap={{ scale: 0.98 }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={handleClick}
        className={`
          inline-flex items-center justify-center font-medium
          rounded-lg border-2 transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
          ${sizeStyles[size]}
          ${isHovering
            ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
            : 'border-secondary bg-secondary/5 text-secondary'
          }
        `}
      >
        <AnimatePresence mode="wait">
          {isHovering ? (
            <motion.span
              key="unfollow"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5"
            >
              <UserMinus size={iconSize} />
              <span>Unfollow</span>
            </motion.span>
          ) : (
            <motion.span
              key="following"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5"
            >
              <span>Following</span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`
        inline-flex items-center justify-center font-medium
        rounded-lg transition-colors duration-200
        bg-primary text-white hover:bg-primary-hover
        shadow-sm
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        ${sizeStyles[size]}
      `}
    >
      <UserPlus size={iconSize} />
      <span>Follow</span>
    </motion.button>
  );
}

export default FollowButton;
