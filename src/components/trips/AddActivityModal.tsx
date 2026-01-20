import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Car,
  CheckCircle,
  Clock,
  Globe,
  Home,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Utensils,
  X,
} from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { Button, Input } from '../ui';
import {  searchByName } from '../../lib/api/overpass';
import type {SearchResult} from '../../lib/api/overpass';
import type { Id } from '../../../convex/_generated/dataModel';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: Id<'trips'>;
  dayNumber: number;
}

type ActivityCategory = 'activity' | 'meal' | 'transport' | 'accommodation' | 'other';

const categoryOptions: Array<{ value: ActivityCategory; label: string; icon: typeof MapPin }> = [
  { value: 'activity', label: 'Activity', icon: MapPin },
  { value: 'meal', label: 'Meal', icon: Utensils },
  { value: 'transport', label: 'Transport', icon: Car },
  { value: 'accommodation', label: 'Stay', icon: Home },
];

export const AddActivityModal = ({ isOpen, onClose, tripId, dayNumber }: AddActivityModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [osmResults, setOsmResults] = useState<Array<SearchResult>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<SearchResult | null>(null);
  const [category, setCategory] = useState<ActivityCategory>('activity');
  const [startTime, setStartTime] = useState('');
  const [addToBucketList, setAddToBucketList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const existingPlaces = useQuery(
    api.places.search,
    searchQuery.length >= 2 ? { searchTerm: searchQuery } : 'skip'
  );

  const createPlace = useMutation(api.places.create);
  const addToBucket = useMutation(api.bucketList.add);
  const addItineraryItem = useMutation(api.itinerary.add);

  const handleOsmSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchByName(searchQuery);
      setOsmResults(results);
    } catch (error) {
      console.error('OSM search failed:', error);
      setSearchError('Search failed. Please try again.');
      setOsmResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleOsmSearch();
    }
  };

  const handleSelectOsmPlace = (place: SearchResult) => {
    setSelectedPlace(place);
  };

  const handleSelectExistingPlace = async (placeId: Id<'places'>) => {
    setIsSubmitting(true);
    try {
      await addItineraryItem({
        tripId,
        placeId,
        dayNumber,
        category,
        startTime: startTime || undefined,
      });
      handleClose();
    } catch (error) {
      console.error('Failed to add activity:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAdd = async () => {
    if (!selectedPlace) return;

    setIsSubmitting(true);
    try {
      const placeId = await createPlace({
        name: selectedPlace.name,
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
        city: selectedPlace.city,
        country: selectedPlace.country,
        category: selectedPlace.category,
        source: 'osm',
        externalId: selectedPlace.id,
      });

      if (addToBucketList) {
        await addToBucket({
          placeId,
          status: 'want_to_visit',
        });
      }

      await addItineraryItem({
        tripId,
        placeId,
        dayNumber,
        category,
        startTime: startTime || undefined,
      });

      handleClose();
    } catch (error) {
      console.error('Failed to add activity:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setOsmResults([]);
    setSelectedPlace(null);
    setCategory('activity');
    setStartTime('');
    setAddToBucketList(false);
    setSearchError(null);
    onClose();
  };

  const handleBack = () => {
    setSelectedPlace(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-surface rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b border-border-light bg-gradient-to-r from-secondary/10 to-accent/10">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {selectedPlace ? 'Confirm Activity' : 'Add Activity'}
              </h2>
              <p className="text-sm text-muted">Day {dayNumber}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-surface transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!selectedPlace ? (
              <div className="p-4 space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Search any place worldwide..."
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={handleOsmSearch} disabled={isSearching || !searchQuery.trim()}>
                    {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}
                  </Button>
                </div>

                {existingPlaces && existingPlaces.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted mb-2 flex items-center gap-1">
                      <Sparkles size={12} />
                      From your places
                    </p>
                    <div className="space-y-1">
                      {existingPlaces.slice(0, 3).map((place) => (
                        <button
                          key={place._id}
                          onClick={() => handleSelectExistingPlace(place._id)}
                          disabled={isSubmitting}
                          className="w-full text-left p-3 rounded-lg border border-secondary/30 bg-secondary/5 hover:border-secondary hover:bg-secondary/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                              <CheckCircle size={16} className="text-secondary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">{place.name}</p>
                              <p className="text-xs text-muted truncate">
                                {[place.city, place.country].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {osmResults.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted mb-2 flex items-center gap-1">
                      <Globe size={12} />
                      Search results
                    </p>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {osmResults.map((place) => (
                        <button
                          key={place.id}
                          onClick={() => handleSelectOsmPlace(place)}
                          className="w-full text-left p-3 rounded-lg border border-border-light hover:border-primary hover:bg-primary-light/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-light/20 flex items-center justify-center">
                              <MapPin size={16} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">{place.name}</p>
                              <p className="text-xs text-muted truncate">
                                {[place.city, place.country].filter(Boolean).join(', ') || 'Unknown location'}
                              </p>
                            </div>
                            {place.category && (
                              <span className="text-[10px] px-2 py-0.5 bg-border-light rounded-full text-muted">
                                {place.category}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchError && (
                  <p className="text-sm text-error text-center py-2">{searchError}</p>
                )}

                {searchQuery.length >= 2 && !isSearching && osmResults.length === 0 && !existingPlaces?.length && (
                  <div className="text-center py-8 text-muted">
                    <Globe className="mx-auto mb-2 opacity-50" size={32} />
                    <p className="text-sm">No places found</p>
                    <p className="text-xs mt-1">Try searching for a city, landmark, or address</p>
                  </div>
                )}

                {!searchQuery && (
                  <div className="text-center py-8 text-muted">
                    <Search className="mx-auto mb-2 opacity-50" size={32} />
                    <p className="text-sm">Search for any place in the world</p>
                    <p className="text-xs mt-1">Restaurants, landmarks, hotels, attractions...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-border-light">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <MapPin size={24} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{selectedPlace.name}</p>
                      <p className="text-sm text-muted">
                        {[selectedPlace.city, selectedPlace.country].filter(Boolean).join(', ')}
                      </p>
                      {selectedPlace.category && (
                        <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          {selectedPlace.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Activity Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {categoryOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = category === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setCategory(opt.value)}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                            isSelected
                              ? 'border-secondary bg-secondary/10 text-secondary'
                              : 'border-border-light hover:border-border text-muted'
                          }`}
                        >
                          <Icon size={18} />
                          <span className="text-xs font-medium">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Clock size={14} className="inline mr-1" />
                    Time (optional)
                  </label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full"
                  />
                </div>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-border-light hover:bg-surface-hover cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={addToBucketList}
                    onChange={(e) => setAddToBucketList(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-secondary focus:ring-secondary"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Also add to bucket list</p>
                    <p className="text-xs text-muted">Save this place to your collection</p>
                  </div>
                </label>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border-light flex gap-2 justify-end bg-surface">
            {selectedPlace ? (
              <>
                <Button variant="ghost" onClick={handleBack}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmAdd}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-secondary to-accent"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
                  Add to Day {dayNumber}
                </Button>
              </>
            ) : (
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddActivityModal;
