import { motion } from 'framer-motion';
import { Avatar } from '../ui/Avatar';
import { ProBadge } from './ProBadge';
import { Id } from '../../../convex/_generated/dataModel';
import { Plane, MapPin, BookOpen, MapPinPlus, Star, LucideIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type ActivityType = 'trip_created' | 'place_visited' | 'journal_posted' | 'place_added';

interface ActivityCardProps {
  activity: {
    _id: Id<'activityFeed'>;
    type: ActivityType;
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
      _id: Id<'users'>;
      displayName?: string;
      avatarUrl?: string;
      role: string;
    };
  };
  animate?: boolean;
}

interface ActivityConfig {
  icon: LucideIcon;
  verb: string;
  color: string;
  bgColor: string;
}

const activityConfig: Record<ActivityType, ActivityConfig> = {
  trip_created: {
    icon: Plane,
    verb: 'created a trip to',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  place_visited: {
    icon: MapPin,
    verb: 'visited',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
  },
  journal_posted: {
    icon: BookOpen,
    verb: 'wrote about',
    color: 'text-accent-hover',
    bgColor: 'bg-accent/20',
  },
  place_added: {
    icon: MapPinPlus,
    verb: 'added',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
};

export function ActivityCard({ activity, animate = true }: ActivityCardProps) {
  const { user, type, metadata, createdAt } = activity;
  const config = activityConfig[type];
  const Icon = config.icon;
  const isPro = ['pro', 'moderator', 'admin'].includes(user.role);

  const getActivityText = () => {
    switch (type) {
      case 'trip_created':
        return metadata?.destination || 'a new destination';
      case 'place_visited':
        return metadata?.placeName || 'a place';
      case 'journal_posted':
        return metadata?.title || metadata?.tripName || 'their travels';
      case 'place_added':
        return metadata?.placeName || 'a new place';
      default:
        return 'something';
    }
  };

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 10 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
      className="p-4 bg-surface rounded-xl border border-border-light hover:border-border
                 hover:shadow-md transition-all duration-200"
    >
      <div className="flex gap-3">
        <a href={`/profile/${user._id}`} className="flex-shrink-0">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Avatar
              src={user.avatarUrl}
              alt={user.displayName || 'User'}
              size="md"
            />
          </motion.div>
        </a>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <a
                href={`/profile/${user._id}`}
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                {user.displayName || 'Traveler'}
              </a>
              {isPro && <ProBadge size="sm" />}
            </div>
            <span className="text-xs text-muted whitespace-nowrap">
              {formatDistanceToNow(createdAt, { addSuffix: true })}
            </span>
          </div>

          <p className="mt-1.5 text-muted flex items-center flex-wrap gap-1">
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${config.bgColor}`}>
              <Icon size={12} className={config.color} />
            </span>
            <span>{config.verb}</span>
            <span className="font-medium text-foreground">{getActivityText()}</span>
          </p>

          {type === 'place_visited' && metadata?.rating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-2 flex items-center gap-0.5"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={
                    i < metadata.rating!
                      ? 'text-accent fill-accent'
                      : 'text-border'
                  }
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default ActivityCard;
