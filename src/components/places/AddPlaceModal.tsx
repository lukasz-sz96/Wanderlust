import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button, Card, CardContent, Input, Textarea } from '../ui';
import { X, MapPin, Search, Plus, Loader2 } from 'lucide-react';
import { searchByName, type SearchResult } from '../../lib/api/overpass';

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'search' | 'create' | 'confirm';

export const AddPlaceModal = ({ isOpen, onClose }: AddPlaceModalProps) => {
  const [step, setStep] = useState<Step>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<SearchResult | null>(null);
  const [status, setStatus] = useState<'want_to_visit' | 'visited'>('want_to_visit');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [manualName, setManualName] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualCountry, setManualCountry] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const createPlace = useMutation(api.places.create);
  const addToBucketList = useMutation(api.bucketList.add);

  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchByName(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchError('Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = (place: SearchResult) => {
    setSelectedPlace(place);
    setStep('confirm');
  };

  const handleCreateManual = () => {
    setStep('create');
  };

  const handleSubmitManual = async () => {
    if (!manualName.trim() || !manualLat || !manualLng) return;

    setIsSubmitting(true);
    try {
      const placeId = await createPlace({
        name: manualName.trim(),
        latitude: parseFloat(manualLat),
        longitude: parseFloat(manualLng),
        city: manualCity.trim() || undefined,
        country: manualCountry.trim() || undefined,
        category: manualCategory.trim() || undefined,
        description: manualDescription.trim() || undefined,
        source: 'user_created',
      });

      await addToBucketList({
        placeId,
        status,
        notes: notes.trim() || undefined,
      });

      handleClose();
    } catch (error) {
      console.error('Failed to create place:', error);
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

      await addToBucketList({
        placeId,
        status,
        notes: notes.trim() || undefined,
      });

      handleClose();
    } catch (error) {
      console.error('Failed to add place:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('search');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedPlace(null);
    setStatus('want_to_visit');
    setNotes('');
    setSearchError(null);
    setManualName('');
    setManualCity('');
    setManualCountry('');
    setManualCategory('');
    setManualDescription('');
    setManualLat('');
    setManualLng('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <Card className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border-light">
          <h2 className="text-xl font-semibold text-foreground">
            {step === 'search' && 'Add Place'}
            {step === 'create' && 'Create New Place'}
            {step === 'confirm' && 'Confirm Addition'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-border-light transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'search' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search for a place..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted">Search results:</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {searchResults.map((place) => (
                      <button
                        key={place.id}
                        onClick={() => handleSelectPlace(place)}
                        className="w-full text-left p-3 rounded-lg border border-border-light hover:border-primary hover:bg-primary-light/10 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary-light/20 flex items-center justify-center flex-shrink-0">
                            <MapPin className="text-primary" size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{place.name}</p>
                            <p className="text-sm text-muted truncate">
                              {[place.city, place.country].filter(Boolean).join(', ') || 'Unknown location'}
                            </p>
                            {place.category && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-border-light rounded-full text-muted">
                                {place.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchError && (
                <p className="text-sm text-error text-center py-4">
                  {searchError}
                </p>
              )}

              {searchQuery && searchResults.length === 0 && !isSearching && !searchError && (
                <p className="text-sm text-muted text-center py-4">
                  No places found. Try a different search or create a new place.
                </p>
              )}

              <div className="pt-4 border-t border-border-light">
                <Button variant="ghost" onClick={handleCreateManual} leftIcon={<Plus size={18} />} className="w-full">
                  Create New Place Manually
                </Button>
              </div>
            </div>
          )}

          {step === 'create' && (
            <div className="space-y-4">
              <Input
                label="Place Name *"
                placeholder="e.g., Eiffel Tower"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Latitude *"
                  placeholder="e.g., 48.8584"
                  type="number"
                  step="any"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                />
                <Input
                  label="Longitude *"
                  placeholder="e.g., 2.2945"
                  type="number"
                  step="any"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  placeholder="e.g., Paris"
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                />
                <Input
                  label="Country"
                  placeholder="e.g., France"
                  value={manualCountry}
                  onChange={(e) => setManualCountry(e.target.value)}
                />
              </div>
              <Input
                label="Category"
                placeholder="e.g., Landmark"
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
              />
              <Textarea
                label="Description"
                placeholder="Tell us about this place..."
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                rows={3}
              />

              <div className="pt-4 border-t border-border-light space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStatus('want_to_visit')}
                      className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                        status === 'want_to_visit'
                          ? 'border-primary bg-primary-light/20 text-primary'
                          : 'border-border-light text-muted hover:border-muted'
                      }`}
                    >
                      Want to Visit
                    </button>
                    <button
                      onClick={() => setStatus('visited')}
                      className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                        status === 'visited'
                          ? 'border-secondary bg-secondary/10 text-secondary'
                          : 'border-border-light text-muted hover:border-muted'
                      }`}
                    >
                      Visited
                    </button>
                  </div>
                </div>
                <Textarea
                  label="Notes (optional)"
                  placeholder="Any notes about this place..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          {step === 'confirm' && selectedPlace && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-border-light/50">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary-light/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-primary" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-foreground">{selectedPlace.name}</p>
                    <p className="text-muted">
                      {[selectedPlace.city, selectedPlace.country].filter(Boolean).join(', ') || 'Unknown location'}
                    </p>
                    {selectedPlace.category && (
                      <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-primary-light/20 text-primary rounded-full">
                        {selectedPlace.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStatus('want_to_visit')}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                      status === 'want_to_visit'
                        ? 'border-primary bg-primary-light/20 text-primary'
                        : 'border-border-light text-muted hover:border-muted'
                    }`}
                  >
                    Want to Visit
                  </button>
                  <button
                    onClick={() => setStatus('visited')}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                      status === 'visited'
                        ? 'border-secondary bg-secondary/10 text-secondary'
                        : 'border-border-light text-muted hover:border-muted'
                    }`}
                  >
                    Visited
                  </button>
                </div>
              </div>

              <Textarea
                label="Notes (optional)"
                placeholder="Any notes about this place..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border-light flex gap-2 justify-end">
          {step === 'search' && (
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          )}
          {step === 'create' && (
            <>
              <Button variant="ghost" onClick={() => setStep('search')}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitManual}
                disabled={!manualName.trim() || !manualLat || !manualLng || isSubmitting}
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
                Add to Bucket List
              </Button>
            </>
          )}
          {step === 'confirm' && (
            <>
              <Button variant="ghost" onClick={() => setStep('search')}>
                Back
              </Button>
              <Button variant="primary" onClick={handleConfirmAdd} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
                Add to Bucket List
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AddPlaceModal;
