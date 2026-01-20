import { useState } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe, MapPin, Plane, Search, Star, TrendingUp, UserPlus, Users } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { AnimatedPage, Badge, Button, Card, CardContent, Input, PageLoading } from '../../components/ui';
import { Avatar } from '../../components/ui/Avatar';
import { FollowButton } from '../../components/social/FollowButton';
import { ProBadge } from '../../components/social/ProBadge';
import type { Id } from '../../../convex/_generated/dataModel';

function TravelersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const suggestedUsers = useQuery(api.social.getSuggestedUsers, { limit: 20 });
  const searchResults = useQuery(
    api.social.searchUsers,
    debouncedQuery.length >= 2 ? { query: debouncedQuery, limit: 20 } : 'skip'
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const timer = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);
    return () => clearTimeout(timer);
  };

  const isSearching = debouncedQuery.length >= 2;
  const users = isSearching ? searchResults : suggestedUsers;

  if (suggestedUsers === undefined) {
    return <PageLoading message="Finding travelers..." />;
  }

  return (
    <AnimatedPage>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Users size={20} className="text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Discover Travelers</h1>
            <p className="text-sm text-muted">Find and follow fellow adventurers</p>
          </div>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Search by name, location, or bio..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>

        {isSearching && searchResults === undefined && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted text-sm mt-2">Searching...</p>
          </div>
        )}

        {isSearching && searchResults && searchResults.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-border-light flex items-center justify-center mx-auto mb-4">
                <Search className="text-muted" size={28} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No travelers found</h3>
              <p className="text-muted">Try a different search term</p>
            </CardContent>
          </Card>
        )}

        {!isSearching && (
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-secondary" />
            <h2 className="font-semibold text-foreground">Suggested Travelers</h2>
          </div>
        )}

        {isSearching && searchResults && searchResults.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <Search size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground">Search Results ({searchResults.length})</h2>
          </div>
        )}

        {users && users.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {users.map((user, index) => (
                <TravelerCard key={user._id} user={user} index={index} showStats={!isSearching} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {!isSearching && suggestedUsers.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <Globe className="text-secondary" size={28} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No suggestions yet</h3>
              <p className="text-muted mb-4">
                You're following everyone! Check back later for new travelers.
              </p>
              <Link to="/feed">
                <Button variant="primary">View Your Feed</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </AnimatedPage>
  );
}

interface TravelerCardProps {
  user: {
    _id: Id<'users'>;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    homeLocation?: string;
    role?: string;
    isFollowing?: boolean;
    stats?: {
      trips: number;
      places: number;
      followers: number;
    };
  };
  index: number;
  showStats?: boolean;
}

function TravelerCard({ user, index, showStats = true }: TravelerCardProps) {
  const isPro = ['pro', 'moderator', 'admin'].includes(user.role || '');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="hover:border-secondary transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Link to="/profile/$userId" params={{ userId: user._id }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Avatar src={user.avatarUrl} alt={user.displayName || 'Traveler'} size="lg" />
              </motion.div>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to="/profile/$userId"
                  params={{ userId: user._id }}
                  className="font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {user.displayName || 'Traveler'}
                </Link>
                {isPro && <ProBadge size="sm" />}
              </div>

              {user.homeLocation && (
                <p className="text-sm text-muted flex items-center gap-1 mt-0.5">
                  <MapPin size={12} className="text-primary/60" />
                  {user.homeLocation}
                </p>
              )}

              {user.bio && (
                <p className="text-sm text-muted mt-1 line-clamp-2">{user.bio}</p>
              )}

              {showStats && user.stats && (
                <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Plane size={12} className="text-primary" />
                    {user.stats.trips} trips
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-secondary" />
                    {user.stats.places} places
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={12} className="text-accent" />
                    {user.stats.followers} followers
                  </span>
                </div>
              )}
            </div>

            <div className="flex-shrink-0">
              <FollowButton userId={user._id} isFollowing={user.isFollowing || false} size="sm" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export const Route = createFileRoute('/_authenticated/travelers')({
  component: TravelersPage,
});
