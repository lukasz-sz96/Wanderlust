import { useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { Avatar } from '../ui/Avatar';
import { ProBadge } from '../social/ProBadge';
import {
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Globe,
  Users,
  Lock,
  Camera,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PlacePhoto {
  _id: Id<'photos'>;
  _creationTime: number;
  userId: Id<'users'>;
  storageId: Id<'_storage'>;
  placeId?: Id<'places'>;
  width?: number;
  height?: number;
  latitude?: number;
  longitude?: number;
  takenAt?: number;
  caption?: string;
  visibility?: 'public' | 'followers' | 'private';
  createdAt: number;
  url: string;
  user: {
    _id: Id<'users'>;
    displayName?: string;
    avatarUrl?: string;
  };
  isOwner: boolean;
}

interface PlacePhotoFeedProps {
  placeId: Id<'places'>;
  className?: string;
}

const visibilityConfig = {
  public: { icon: Globe, label: 'Public', color: 'text-secondary' },
  followers: { icon: Users, label: 'Followers', color: 'text-primary' },
  private: { icon: Lock, label: 'Private', color: 'text-muted' },
};

export const PlacePhotoFeed = ({ placeId, className = '' }: PlacePhotoFeedProps) => {
  const photos = useQuery(api.photos.listByPlace, { placeId });
  const deletePhoto = useMutation(api.photos.remove);
  const updateVisibility = useMutation(api.photos.updateVisibility);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<Id<'photos'> | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<Id<'photos'> | null>(null);
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});

  const handleDelete = async (photoId: Id<'photos'>) => {
    if (!confirm('Delete this photo?')) return;

    setDeletingId(photoId);
    setMenuOpenId(null);
    try {
      await deletePhoto({ photoId });
      if (selectedIndex !== null) {
        setSelectedIndex(null);
      }
    } catch (error) {
      console.error('Failed to delete photo:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleVisibilityChange = async (
    photoId: Id<'photos'>,
    visibility: 'public' | 'followers' | 'private'
  ) => {
    setMenuOpenId(null);
    try {
      await updateVisibility({ photoId, visibility });
    } catch (error) {
      console.error('Failed to update visibility:', error);
    }
  };

  const handleImageLoad = useCallback((photoId: string) => {
    setImageLoaded((prev) => ({ ...prev, [photoId]: true }));
  }, []);

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (photos && selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') setSelectedIndex(null);
  };

  if (photos === undefined) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Camera className="w-8 h-8 text-muted" />
        </motion.div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
          <Camera className="w-8 h-8 text-muted" />
        </div>
        <p className="text-muted text-sm">No photos yet</p>
        <p className="text-muted/60 text-xs mt-1">Be the first to share a memory</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {photos.map((photo, index) => {
          const VisibilityIcon = visibilityConfig[photo.visibility || 'private'].icon;
          const visibilityLabel = visibilityConfig[photo.visibility || 'private'].label;
          const visibilityColor = visibilityConfig[photo.visibility || 'private'].color;

          return (
            <motion.article
              key={photo._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="group relative"
            >
              <div className="flex items-center gap-3 mb-3">
                <Link
                  to="/profile/$userId"
                  params={{ userId: photo.user._id }}
                  className="flex-shrink-0"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative"
                  >
                    <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-primary via-accent to-secondary opacity-60" />
                    <Avatar
                      src={photo.user.avatarUrl}
                      alt={photo.user.displayName || 'User'}
                      size="sm"
                      className="relative ring-2 ring-surface"
                    />
                  </motion.div>
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link
                      to="/profile/$userId"
                      params={{ userId: photo.user._id }}
                      className="font-semibold text-foreground hover:text-primary transition-colors text-sm truncate"
                    >
                      {photo.isOwner ? 'You' : photo.user.displayName || 'Traveler'}
                    </Link>
                    {photo.isOwner && (
                      <span
                        className={`inline-flex items-center gap-1 text-xs ${visibilityColor}`}
                        title={visibilityLabel}
                      >
                        <VisibilityIcon size={12} />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted">
                    {formatDistanceToNow(photo.createdAt, { addSuffix: true })}
                  </p>
                </div>

                {photo.isOwner && (
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === photo._id ? null : photo._id)}
                      className="p-2 rounded-full hover:bg-surface-hover transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal size={18} className="text-muted" />
                    </button>

                    <AnimatePresence>
                      {menuOpenId === photo._id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border-light rounded-xl shadow-lg overflow-hidden z-20"
                        >
                          <div className="p-2 border-b border-border-light">
                            <p className="text-xs text-muted px-2 mb-2">Visibility</p>
                            {(['public', 'followers', 'private'] as const).map((vis) => {
                              const Icon = visibilityConfig[vis].icon;
                              const isActive = (photo.visibility || 'private') === vis;
                              return (
                                <button
                                  key={vis}
                                  onClick={() => handleVisibilityChange(photo._id, vis)}
                                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                                    isActive
                                      ? 'bg-primary/10 text-primary'
                                      : 'hover:bg-surface-hover text-foreground'
                                  }`}
                                >
                                  <Icon size={14} />
                                  {visibilityConfig[vis].label}
                                </button>
                              );
                            })}
                          </div>
                          <div className="p-2">
                            <button
                              onClick={() => handleDelete(photo._id)}
                              disabled={deletingId === photo._id}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-error hover:bg-error/10 transition-colors"
                            >
                              {deletingId === photo._id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                              Delete photo
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <motion.div
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                onClick={() => setSelectedIndex(index)}
                className="relative cursor-pointer rounded-2xl overflow-hidden bg-surface-hover"
              >
                <div className="relative aspect-[4/3]">
                  {!imageLoaded[photo._id] && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 animate-pulse" />
                  )}
                  <motion.img
                    src={photo.url}
                    alt={photo.caption || 'Photo'}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      imageLoaded[photo._id] ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => handleImageLoad(photo._id)}
                    loading="lazy"
                  />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.div>

              {photo.caption && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  className="mt-3 text-sm text-foreground leading-relaxed"
                >
                  <Link
                    to="/profile/$userId"
                    params={{ userId: photo.user._id }}
                    className="font-semibold hover:text-primary transition-colors mr-1.5"
                  >
                    {photo.isOwner ? 'You' : photo.user.displayName || 'Traveler'}
                  </Link>
                  {photo.caption}
                </motion.p>
              )}
            </motion.article>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedIndex !== null && photos[selectedIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setSelectedIndex(null)}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            >
              <X size={24} />
            </button>

            {selectedIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {selectedIndex < photos.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
              >
                <ChevronRight size={28} />
              </button>
            )}

            <motion.div
              key={photos[selectedIndex]._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-[90vw] max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={photos[selectedIndex].url}
                alt={photos[selectedIndex].caption || 'Photo'}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
            </motion.div>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative">
                    <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-primary via-accent to-secondary opacity-60" />
                    <Avatar
                      src={photos[selectedIndex].user.avatarUrl}
                      alt={photos[selectedIndex].user.displayName || 'User'}
                      size="sm"
                      className="relative ring-2 ring-black/50"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">
                      {photos[selectedIndex].isOwner
                        ? 'You'
                        : photos[selectedIndex].user.displayName || 'Traveler'}
                    </p>
                    <p className="text-xs text-white/60">
                      {formatDistanceToNow(photos[selectedIndex].createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
                {photos[selectedIndex].caption && (
                  <p className="text-white/90 text-sm">{photos[selectedIndex].caption}</p>
                )}
              </div>
            </div>

            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              {selectedIndex + 1} / {photos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlacePhotoFeed;
