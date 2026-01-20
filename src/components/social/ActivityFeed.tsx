import { useState } from 'react';
import { useQuery } from 'convex/react';
import { Link } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, RefreshCw, UserPlus, Users } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { Skeleton } from '../ui/Skeleton';
import { Button } from '../ui/Button';
import { ActivityCard } from './ActivityCard';

interface ActivityFeedProps {
  className?: string;
}

type Activity = {
  _id: string;
  userId: string;
  type: 'trip_created' | 'place_visited' | 'journal_posted' | 'place_added';
  referenceId: string;
  metadata?: {
    destination?: string;
    placeName?: string;
    rating?: number;
    title?: string;
    tripName?: string;
  };
  createdAt: number;
  user: {
    displayName?: string;
    avatarUrl?: string;
    role?: string;
  };
};

export function ActivityFeed({ className = '' }: ActivityFeedProps) {
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [allActivities, setAllActivities] = useState<Array<Activity>>([]);

  const result = useQuery(api.feed.getFeed, { limit: 20, cursor });

  // Merge new results with existing
  const newActivities: Array<Activity> = result?.activities
    ? (result.activities as unknown as Array<Activity>)
    : [];
  const activities: Array<Activity> = cursor
    ? [...allActivities, ...newActivities]
    : newActivities;

  const handleLoadMore = () => {
    if (result?.nextCursor) {
      setAllActivities(activities);
      setCursor(result.nextCursor);
    }
  };

  if (result === undefined && !cursor) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Skeleton className="h-24 rounded-xl" />
          </motion.div>
        ))}
      </div>
    );
  }

  if (activities.length === 0 && !cursor) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex flex-col items-center justify-center py-16 text-center ${className}`}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"
        >
          <Users size={28} className="text-primary" />
        </motion.div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Your feed is empty
        </h3>
        <p className="text-muted max-w-sm mb-4">
          Follow travelers to see their adventures here
        </p>
        <Link to="/travelers">
          <Button variant="primary" leftIcon={<UserPlus size={16} />}>
            Find Travelers to Follow
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <AnimatePresence mode="popLayout">
        {activities.map((activity, index) => (
          <motion.div
            key={activity._id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              type: 'spring' as const,
              stiffness: 300,
              damping: 30,
              delay: cursor ? (index - allActivities.length) * 0.05 : index * 0.05,
            }}
          >
            <ActivityCard
              activity={activity as Parameters<typeof ActivityCard>[0]['activity']}
              animate={false}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {result?.nextCursor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center pt-4"
        >
          <Button
            variant="outline"
            onClick={handleLoadMore}
            leftIcon={<ChevronDown size={16} />}
          >
            Load more
          </Button>
        </motion.div>
      )}

      {result === undefined && cursor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center pt-4"
        >
          <RefreshCw size={20} className="animate-spin mx-auto text-muted" />
        </motion.div>
      )}
    </div>
  );
}

export default ActivityFeed;
