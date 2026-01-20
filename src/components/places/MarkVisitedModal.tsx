import { useEffect, useState } from 'react';
import { useMutation } from 'convex/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, CheckCircle, Cloud, Loader2, Star, X } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { Button, Card, CardContent, Input } from '../ui';
import {  fetchHistoricalWeather, formatTemperature } from '../../lib/api/weather';
import type {HistoricalWeather} from '../../lib/api/weather';
import type { Id } from '../../../convex/_generated/dataModel';

interface MarkVisitedModalProps {
  isOpen: boolean;
  onClose: () => void;
  bucketListItemId: Id<'bucketListItems'>;
  placeName: string;
  latitude: number;
  longitude: number;
}

export const MarkVisitedModal = ({
  isOpen,
  onClose,
  bucketListItemId,
  placeName,
  latitude,
  longitude,
}: MarkVisitedModalProps) => {
  const [visitedDate, setVisitedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [rating, setRating] = useState<number | null>(null);
  const [weather, setWeather] = useState<HistoricalWeather | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateStatus = useMutation(api.bucketList.updateStatus);

  useEffect(() => {
    if (!isOpen || !visitedDate) return;

    const loadWeather = async () => {
      setIsLoadingWeather(true);
      setWeather(null);

      const today = new Date().toISOString().split('T')[0];
      if (visitedDate > today) {
        setIsLoadingWeather(false);
        return;
      }

      const data = await fetchHistoricalWeather(latitude, longitude, visitedDate);
      setWeather(data);
      setIsLoadingWeather(false);
    };

    const debounceTimer = setTimeout(loadWeather, 300);
    return () => clearTimeout(debounceTimer);
  }, [visitedDate, latitude, longitude, isOpen]);

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await updateStatus({
        itemId: bucketListItemId,
        status: 'visited',
        visitedDate,
        rating: rating ?? undefined,
        weatherSnapshot: weather
          ? {
              temperature: weather.temperature,
              condition: weather.condition,
              icon: weather.icon,
            }
          : undefined,
      });
      onClose();
    } catch (error) {
      console.error('Failed to mark as visited:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl">
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <CheckCircle className="text-secondary" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Mark as Visited</h2>
                    <p className="text-sm text-muted">{placeName}</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-border-light transition-colors">
                  <X size={20} className="text-muted" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Calendar size={16} className="text-primary" />
                    When did you visit?
                  </label>
                  <Input
                    type="date"
                    value={visitedDate}
                    onChange={(e) => setVisitedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Cloud size={16} className="text-info" />
                    Weather that day
                  </label>
                  <div className="p-4 rounded-xl bg-border-light/50 min-h-[72px] flex items-center">
                    {isLoadingWeather ? (
                      <div className="flex items-center gap-2 text-muted">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-sm">Fetching weather data...</span>
                      </div>
                    ) : weather ? (
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">{weather.icon}</span>
                        <div>
                          <p className="text-lg font-semibold text-foreground">
                            {formatTemperature(weather.temperature)}
                          </p>
                          <p className="text-sm text-muted">{weather.condition}</p>
                          <p className="text-xs text-muted mt-0.5">
                            High: {formatTemperature(weather.temperatureMax)} / Low:{' '}
                            {formatTemperature(weather.temperatureMin)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted">
                        {visitedDate > new Date().toISOString().split('T')[0]
                          ? 'Cannot get weather for future dates'
                          : 'Weather data not available'}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Star size={16} className="text-warning" />
                    Rate your experience (optional)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(rating === star ? null : star)}
                        className="p-2 rounded-lg hover:bg-border-light transition-colors"
                      >
                        <Star
                          size={28}
                          className={rating && rating >= star ? 'text-warning fill-warning' : 'text-muted'}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button variant="ghost" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={isSaving || !visitedDate}
                  leftIcon={isSaving ? <Loader2 size={18} className="animate-spin" /> : undefined}
                >
                  {isSaving ? 'Saving...' : 'Mark as Visited'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MarkVisitedModal;
