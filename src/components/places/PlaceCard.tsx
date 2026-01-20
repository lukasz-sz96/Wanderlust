import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Heart, MapPin, MoreHorizontal, Star } from 'lucide-react';
import { Badge, Card, IconButton } from '../ui';
import type { Id } from '../../../convex/_generated/dataModel';

export interface PlaceCardProps {
  id: Id<'places'>;
  name: string;
  category?: string;
  city?: string;
  country?: string;
  latitude: number;
  longitude: number;
  description?: string;
  coverPhotoUrl?: string;
  rating?: number;
  status?: 'want_to_visit' | 'visited' | 'skipped';
  onAddToBucketList?: () => void;
  onRemove?: () => void;
}

export const PlaceCard = ({
  id,
  name,
  category,
  city,
  country,
  description,
  coverPhotoUrl,
  rating,
  status,
  onAddToBucketList,
}: PlaceCardProps) => {
  const location = [city, country].filter(Boolean).join(', ');

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card hoverable padding="none" className="overflow-hidden">
        <Link to="/places/$placeId" params={{ placeId: id }} className="block">
          <div className="relative h-40 bg-border-light overflow-hidden">
            {coverPhotoUrl ? (
              <img src={coverPhotoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-light/20 to-secondary-light/20">
                <MapPin className="text-primary" size={40} />
              </div>
            )}
            {category && (
              <div className="absolute top-3 left-3">
                <Badge variant="default" className="bg-surface/90 backdrop-blur-sm">
                  {category}
                </Badge>
              </div>
            )}
            {status === 'visited' && rating && (
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-surface/90 backdrop-blur-sm px-2 py-1 rounded-full">
                <Star className="text-warning fill-warning" size={14} />
                <span className="text-sm font-medium">{rating}</span>
              </div>
            )}
          </div>
        </Link>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Link to="/places/$placeId" params={{ placeId: id }} className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate hover:text-primary transition-colors">{name}</h3>
            </Link>
            <div className="flex items-center gap-1">
              {onAddToBucketList && !status && (
                <IconButton
                  variant="ghost"
                  size="sm"
                  label="Add to bucket list"
                  onClick={(e) => {
                    e.preventDefault();
                    onAddToBucketList();
                  }}
                >
                  <Heart size={16} />
                </IconButton>
              )}
              {status && (
                <IconButton variant="ghost" size="sm" label="More options">
                  <MoreHorizontal size={16} />
                </IconButton>
              )}
            </div>
          </div>

          {location && (
            <p className="text-sm text-muted flex items-center gap-1 mb-2">
              <MapPin size={14} />
              {location}
            </p>
          )}

          {description && <p className="text-sm text-muted line-clamp-2">{description}</p>}

          {status && (
            <div className="mt-3 pt-3 border-t border-border-light">
              <Badge
                variant={status === 'visited' ? 'success' : status === 'want_to_visit' ? 'primary' : 'default'}
                dot
              >
                {status === 'visited' ? 'Visited' : status === 'want_to_visit' ? 'Want to visit' : 'Skipped'}
              </Badge>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default PlaceCard;
