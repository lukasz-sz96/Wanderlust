import { useState } from 'react';
import { useMutation } from 'convex/react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { X, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface Photo {
  _id: Id<'photos'>;
  url: string;
  width?: number;
  height?: number;
  caption?: string;
  createdAt: number;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onPhotoDeleted?: (photoId: Id<'photos'>) => void;
  editable?: boolean;
  className?: string;
}

export const PhotoGallery = ({ photos, onPhotoDeleted, editable = false, className = '' }: PhotoGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<Id<'photos'> | null>(null);

  const deletePhoto = useMutation(api.photos.remove);

  const handleDelete = async (photoId: Id<'photos'>, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this photo?')) return;

    setDeletingId(photoId);
    try {
      await deletePhoto({ photoId });
      onPhotoDeleted?.(photoId);
      if (selectedIndex !== null) {
        setSelectedIndex(null);
      }
    } catch (error) {
      console.error('Failed to delete photo:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') setSelectedIndex(null);
  };

  if (photos.length === 0) return null;

  return (
    <div className={className}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((photo, index) => (
          <motion.div
            key={photo._id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group aspect-square rounded-lg overflow-hidden cursor-pointer bg-border-light"
            onClick={() => setSelectedIndex(index)}
          >
            <img
              src={photo.url}
              alt={photo.caption || 'Photo'}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {editable && (
              <button
                onClick={(e) => handleDelete(photo._id, e)}
                disabled={deletingId === photo._id}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error"
              >
                {deletingId === photo._id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedIndex !== null && photos[selectedIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
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

            <motion.img
              key={photos[selectedIndex]._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={photos[selectedIndex].url}
              alt={photos[selectedIndex].caption || 'Photo'}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
              {selectedIndex + 1} / {photos.length}
              {photos[selectedIndex].caption && (
                <span className="ml-4 text-white">{photos[selectedIndex].caption}</span>
              )}
            </div>

            {editable && (
              <button
                onClick={(e) => handleDelete(photos[selectedIndex]._id, e)}
                disabled={deletingId === photos[selectedIndex]._id}
                className="absolute bottom-4 right-4 px-4 py-2 rounded-lg bg-error/80 text-white hover:bg-error transition-colors flex items-center gap-2"
              >
                {deletingId === photos[selectedIndex]._id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Delete
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotoGallery;
