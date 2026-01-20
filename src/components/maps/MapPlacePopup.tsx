import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, ExternalLink, X, Star, Heart, CheckCircle, Compass, XCircle } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export interface PlacePopupData {
  id: string;
  name: string;
  city?: string;
  country?: string;
  latitude: number;
  longitude: number;
  status: 'want_to_visit' | 'visited' | 'skipped';
  rating?: number;
  category?: string;
}

interface MapPlacePopupProps {
  place: PlacePopupData | null;
  onClose: () => void;
  position?: { x: number; y: number };
  containerRef?: React.RefObject<HTMLDivElement>;
}

export const MapPlacePopup = ({ place, onClose, position, containerRef }: MapPlacePopupProps) => {
  if (!place) return null;

  const isVisited = place.status === 'visited';
  const isSkipped = place.status === 'skipped';
  const locationString = [place.city, place.country].filter(Boolean).join(', ');

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
    window.open(url, '_blank');
  };

  const getPopupPosition = () => {
    if (!position) return {};

    const popupWidth = 320;
    const popupHeight = 340;

    const containerRect = containerRef?.current?.getBoundingClientRect();
    const offsetX = containerRect?.left ?? 0;
    const offsetY = containerRect?.top ?? 0;
    const containerWidth = containerRect?.width ?? window.innerWidth;
    const containerHeight = containerRect?.height ?? window.innerHeight;

    let left = position.x - offsetX - popupWidth / 2;
    let top = position.y - offsetY - popupHeight - 20;

    left = Math.max(10, Math.min(left, containerWidth - popupWidth - 10));
    top = Math.max(10, Math.min(top, containerHeight - popupHeight - 10));

    if (top < 10) {
      top = position.y - offsetY + 50;
    }

    return { left, top };
  };

  const popupStyle = getPopupPosition();

  return (
    <AnimatePresence>
      {place && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
            }}
            style={position ? popupStyle : {}}
            className={`
              absolute z-50 w-80
              ${!position ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2' : ''}
            `}
          >
            <div className="relative">
              <div
                className="
                  absolute -inset-1 rounded-2xl opacity-30 blur-xl
                  bg-gradient-to-br from-primary via-accent to-secondary
                "
              />

              <div
                className="
                  relative bg-surface rounded-2xl overflow-hidden
                  border border-border-light shadow-2xl
                "
              >
                <div
                  className={`
                    h-24 relative overflow-hidden
                    ${isVisited
                      ? 'bg-gradient-to-br from-secondary/80 via-secondary/60 to-teal-600/40'
                      : isSkipped
                        ? 'bg-gradient-to-br from-gray-500/80 via-gray-400/60 to-slate-500/40'
                        : 'bg-gradient-to-br from-primary/80 via-primary/60 to-amber-500/40'
                    }
                  `}
                >
                  <div className="absolute inset-0 opacity-20">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
                        </pattern>
                      </defs>
                      <rect width="100" height="100" fill="url(#grid)" />
                    </svg>
                  </div>

                  <motion.div
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 0.15 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="absolute -right-6 -top-6 text-white"
                  >
                    <Compass size={120} strokeWidth={1} />
                  </motion.div>

                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                        ${isVisited
                          ? 'bg-white/90 text-secondary'
                          : isSkipped
                            ? 'bg-white/90 text-gray-500'
                            : 'bg-white/90 text-primary'
                        }
                      `}
                    >
                      {isVisited ? (
                        <>
                          <CheckCircle size={12} />
                          <span>Visited</span>
                        </>
                      ) : isSkipped ? (
                        <>
                          <XCircle size={12} />
                          <span>Skipped</span>
                        </>
                      ) : (
                        <>
                          <Heart size={12} />
                          <span>Want to Visit</span>
                        </>
                      )}
                    </motion.div>

                    {isVisited && place.rating && (
                      <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="flex items-center gap-1 bg-white/90 px-2 py-1 rounded-full"
                      >
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={
                              i < place.rating!
                                ? 'text-warning fill-warning'
                                : 'text-border'
                            }
                          />
                        ))}
                      </motion.div>
                    )}
                  </div>

                  <button
                    onClick={onClose}
                    className="
                      absolute top-3 right-3 p-1.5 rounded-full
                      bg-black/20 hover:bg-black/40 text-white
                      transition-colors backdrop-blur-sm
                    "
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="p-4">
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h3 className="text-lg font-semibold text-foreground leading-tight mb-1">
                      {place.name}
                    </h3>
                    {locationString && (
                      <div className="flex items-center gap-1.5 text-sm text-muted">
                        <MapPin size={14} className="flex-shrink-0" />
                        <span>{locationString}</span>
                      </div>
                    )}
                  </motion.div>

                  {place.category && (
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className="mt-3"
                    >
                      <span className="inline-block px-2.5 py-1 bg-border-light rounded-md text-xs font-medium text-muted capitalize">
                        {place.category}
                      </span>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 pt-4 border-t border-border-light"
                  >
                    <div className="flex items-center gap-2 text-xs text-muted mb-4">
                      <Navigation size={12} />
                      <span>
                        {place.latitude.toFixed(4)}°, {place.longitude.toFixed(4)}°
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        to="/places/$placeId"
                        params={{ placeId: place.id }}
                        className="
                          flex-1 flex items-center justify-center gap-2
                          px-4 py-2.5 rounded-xl font-medium text-sm
                          bg-gradient-to-r from-primary to-primary-hover
                          text-white shadow-lg shadow-primary/25
                          hover:shadow-xl hover:shadow-primary/30
                          hover:-translate-y-0.5
                          transition-all duration-200
                        "
                      >
                        <ExternalLink size={14} />
                        View Details
                      </Link>

                      <button
                        onClick={handleGetDirections}
                        className="
                          flex items-center justify-center
                          px-4 py-2.5 rounded-xl font-medium text-sm
                          bg-border-light text-foreground
                          hover:bg-border hover:-translate-y-0.5
                          transition-all duration-200
                        "
                      >
                        <Navigation size={14} />
                      </button>
                    </div>
                  </motion.div>
                </div>

                <div
                  className="
                    absolute -bottom-2 left-1/2 -translate-x-1/2
                    w-4 h-4 rotate-45 bg-surface border-r border-b border-border-light
                  "
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MapPlacePopup;
