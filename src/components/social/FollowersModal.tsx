import { useState } from 'react';
import { useQuery } from 'convex/react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { X, Users, Loader2 } from 'lucide-react';
import { Card, CardContent, Button } from '../ui';
import { Avatar } from '../ui/Avatar';
import { FollowButton } from './FollowButton';
import { ProBadge } from './ProBadge';
import { Link } from '@tanstack/react-router';

type Tab = 'followers' | 'following';

interface FollowersModalProps {
  userId: Id<'users'>;
  initialTab?: Tab;
  isOpen: boolean;
  onClose: () => void;
}

export function FollowersModal({ userId, initialTab = 'followers', isOpen, onClose }: FollowersModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const followers = useQuery(api.social.getFollowers, isOpen ? { userId, limit: 50 } : 'skip');
  const following = useQuery(api.social.getFollowing, isOpen ? { userId, limit: 50 } : 'skip');

  if (!isOpen) return null;

  const users = activeTab === 'followers' ? followers?.followers : following?.following;
  const isLoading = activeTab === 'followers' ? followers === undefined : following === undefined;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md max-h-[80vh] flex flex-col"
        >
          <Card className="flex flex-col max-h-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border-light">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('followers')}
                  className={`pb-2 font-medium transition-colors relative ${
                    activeTab === 'followers' ? 'text-foreground' : 'text-muted hover:text-foreground'
                  }`}
                >
                  Followers
                  {activeTab === 'followers' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`pb-2 font-medium transition-colors relative ${
                    activeTab === 'following' ? 'text-foreground' : 'text-muted hover:text-foreground'
                  }`}
                >
                  Following
                  {activeTab === 'following' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                    />
                  )}
                </button>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-border-light transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-muted" size={24} />
                </div>
              ) : users && users.length > 0 ? (
                <div className="space-y-2">
                  {users.map((user) => (
                    <UserListItem key={user._id} user={user} onClose={onClose} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-border-light flex items-center justify-center mx-auto mb-3">
                    <Users className="text-muted" size={24} />
                  </div>
                  <p className="text-muted">
                    {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface UserListItemProps {
  user: {
    _id: Id<'users'>;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    isFollowing: boolean;
  };
  onClose: () => void;
}

function UserListItem({ user, onClose }: UserListItemProps) {
  const isPro = false;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-border-light/50 transition-colors">
      <Link to="/profile/$userId" params={{ userId: user._id }} onClick={onClose}>
        <Avatar src={user.avatarUrl} alt={user.displayName || 'User'} size="md" />
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          to="/profile/$userId"
          params={{ userId: user._id }}
          onClick={onClose}
          className="flex items-center gap-1.5"
        >
          <span className="font-medium text-foreground hover:text-primary transition-colors truncate">
            {user.displayName || 'Traveler'}
          </span>
          {isPro && <ProBadge size="sm" />}
        </Link>
        {user.bio && <p className="text-sm text-muted truncate">{user.bio}</p>}
      </div>

      <FollowButton userId={user._id} isFollowing={user.isFollowing} size="sm" />
    </div>
  );
}

export default FollowersModal;
