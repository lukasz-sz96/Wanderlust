import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { BookOpen, ChevronRight, MapPin, MapPinPlus, Plane, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '../ui/Avatar';
import { ProBadge } from './ProBadge';
import type { Id } from '../../../convex/_generated/dataModel';
import type { LucideIcon} from 'lucide-react';

type ActivityType = 'trip_created' | 'place_visited' | 'journal_posted' | 'place_added';

interface ActivityCardProps {
  activity: {
    _id: Id<'activityFeed'>;
    userId: Id<'users'>;
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
      displayName?: string;
      avatarUrl?: string;
      role?: string;
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
  const { user, userId, type, metadata, createdAt, referenceId } = activity;
  const config = activityConfig[type];
  const Icon = config.icon;
  const isPro = user.role ? ['pro', 'moderator', 'admin'].includes(user.role) : false;

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

  const getActivityLink = (): string | null => {
    switch (type) {
      case 'trip_created':
        return `/trips/${referenceId}`;
      case 'place_visited':
      case 'place_added':
        return `/places/${referenceId}`;
      case 'journal_posted':
        return `/journal/${referenceId}`;
      default:
        return null;
    }
  };

  const activityLink = getActivityLink();

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
        <Link to="/profile/$userId" params={{ userId }} className="flex-shrink-0">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Avatar
              src={user.avatarUrl}
              alt={user.displayName || 'User'}
              size="md"
            />
          </motion.div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                to="/profile/$userId"
                params={{ userId }}
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                {user.displayName || 'Traveler'}
              </Link>
              {isPro && <ProBadge size="sm" />}
            </div>
            <span className="text-xs text-muted whitespace-nowrap">
              {formatDistanceToNow(createdAt, { addSuffix: true })}
            </span>
          </div>

          <div className="mt-1.5 text-muted flex items-center flex-wrap gap-1">
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${config.bgColor}`}>
              <Icon size={12} className={config.color} />
            </span>
            <span>{config.verb}</span>
            {activityLink ? (
              <Link
                to={activityLink}
                className="font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {getActivityText()}
                <ChevronRight size={14} className="opacity-50" />
              </Link>
            ) : (
              <span className="font-medium text-foreground">{getActivityText()}</span>
            )}
          </div>

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
