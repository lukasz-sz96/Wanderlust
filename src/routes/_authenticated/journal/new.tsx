import { Link, createFileRoute, useNavigate  } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Calendar, Cloud, Frown, Loader2, MapPin, Meh, Plane, Save, Search, Smile, Star, X } from 'lucide-react';
import { api } from '../../../../convex/_generated/api';
import { Button, Card, CardContent, Input, PageLoading, RichTextEditor } from '../../../components/ui';
import {  fetchHistoricalWeather, formatTemperature } from '../../../lib/api/weather';
import type { Id } from '../../../../convex/_generated/dataModel';
import type {HistoricalWeather} from '../../../lib/api/weather';

type Mood = 'amazing' | 'good' | 'neutral' | 'challenging';

const getTodayDate = () => new Date().toISOString().split('T')[0];

const NewJournalEntryPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<any>(null);
  const [entryDate, setEntryDate] = useState('');
  const [mood, setMood] = useState<Mood | undefined>();
  const [tripId, setTripId] = useState<Id<'trips'> | undefined>();
  const [placeId, setPlaceId] = useState<Id<'places'> | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weather, setWeather] = useState<HistoricalWeather | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [placeSearchTerm, setPlaceSearchTerm] = useState('');
  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);
  const placeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (placeDropdownRef.current && !placeDropdownRef.current.contains(event.target as Node)) {
        setShowPlaceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasContent = () => {
    if (!content) return false;
    if (content.type === 'doc' && content.content) {
      return content.content.some((node: any) => {
        if (node.content) {
          return node.content.some((child: any) => child.text?.trim());
        }
        return false;
      });
    }
    return false;
  };

  useEffect(() => {
    setEntryDate(getTodayDate());
  }, []);

  const trips = useQuery(api.trips.list, {});
  const bucketList = useQuery(api.bucketList.list, {});
  const createEntry = useMutation(api.journal.create);
  const placeSearchResults = useQuery(
    api.places.search,
    placeSearchTerm.length >= 2 ? { searchTerm: placeSearchTerm } : 'skip'
  );
  const allPlaces = useQuery(api.places.list, {});

  const selectedPlace = allPlaces?.find((place) => place._id === placeId);

  useEffect(() => {
    if (!placeId || !entryDate || !selectedPlace) {
      setWeather(null);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (entryDate > today) {
      setWeather(null);
      return;
    }

    const loadWeather = async () => {
      setIsLoadingWeather(true);
      const data = await fetchHistoricalWeather(selectedPlace.latitude, selectedPlace.longitude, entryDate);
      setWeather(data);
      setIsLoadingWeather(false);
    };

    const debounceTimer = setTimeout(loadWeather, 300);
    return () => clearTimeout(debounceTimer);
  }, [placeId, entryDate, selectedPlace]);

  if (trips === undefined || bucketList === undefined) {
    return <PageLoading message="Loading..." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasContent()) return;

    setIsSubmitting(true);
    try {
      const entryId = await createEntry({
        title: title.trim() || undefined,
        content,
        entryDate,
        mood,
        tripId,
        placeId,
        weatherSnapshot: weather
          ? {
              temperature: weather.temperature,
              condition: weather.condition,
              icon: weather.icon,
            }
          : undefined,
      });

      navigate({ to: '/journal/$entryId', params: { entryId } });
    } catch (error) {
      console.error('Failed to create entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const moods: Array<{ id: Mood; label: string; icon: React.ReactNode; color: string }> = [
    { id: 'amazing', label: 'Amazing', icon: <Star size={20} />, color: 'text-warning bg-warning/10 border-warning' },
    { id: 'good', label: 'Good', icon: <Smile size={20} />, color: 'text-secondary bg-secondary/10 border-secondary' },
    { id: 'neutral', label: 'Neutral', icon: <Meh size={20} />, color: 'text-muted bg-border-light border-border' },
    {
      id: 'challenging',
      label: 'Challenging',
      icon: <Frown size={20} />,
      color: 'text-primary bg-primary-light/10 border-primary',
    },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          to="/journal"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Journal
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">New Journal Entry</h1>
              <p className="text-muted">Capture your travel memories</p>
            </div>

            <Input
              label="Title (optional)"
              placeholder="Give your entry a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <Input label="Date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">How are you feeling?</label>
              <div className="flex flex-wrap gap-2">
                {moods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMood(mood === m.id ? undefined : m.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors
                      ${mood === m.id ? m.color : 'text-muted bg-surface border-border-light hover:border-border'}
                    `}
                  >
                    {m.icon}
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">What happened today?</label>
              <RichTextEditor
                content=""
                onChange={setContent}
                placeholder="Write about your experiences, thoughts, and memories..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Plane size={14} className="inline mr-1" />
                  Link to Trip (optional)
                </label>
                <select
                  value={tripId || ''}
                  onChange={(e) => setTripId(e.target.value ? (e.target.value as Id<'trips'>) : undefined)}
                  className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">No trip</option>
                  {trips.map((trip) => (
                    <option key={trip._id} value={trip._id}>
                      {trip.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative" ref={placeDropdownRef}>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <MapPin size={14} className="inline mr-1" />
                  Link to Place (optional)
                </label>
                {selectedPlace ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-light bg-surface">
                    <MapPin size={16} className="text-primary" />
                    <span className="flex-1 text-foreground">{selectedPlace.name}</span>
                    <button
                      type="button"
                      onClick={() => setPlaceId(undefined)}
                      className="p-1 rounded hover:bg-border-light text-muted hover:text-foreground"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                      <input
                        type="text"
                        value={placeSearchTerm}
                        onChange={(e) => {
                          setPlaceSearchTerm(e.target.value);
                          setShowPlaceDropdown(true);
                        }}
                        onFocus={() => setShowPlaceDropdown(true)}
                        placeholder="Search places..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-border-light bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    {showPlaceDropdown && (
                      <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-border-light bg-surface shadow-lg">
                        {placeSearchTerm.length >= 2 ? (
                          placeSearchResults === undefined ? (
                            <div className="p-3 text-center text-muted">Searching...</div>
                          ) : placeSearchResults.length === 0 ? (
                            <div className="p-3 text-center text-muted">No places found</div>
                          ) : (
                            placeSearchResults.map((place) => (
                              <button
                                key={place._id}
                                type="button"
                                onClick={() => {
                                  setPlaceId(place._id);
                                  setPlaceSearchTerm('');
                                  setShowPlaceDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-border-light transition-colors"
                              >
                                <p className="font-medium text-foreground">{place.name}</p>
                                <p className="text-sm text-muted">
                                  {[place.city, place.country].filter(Boolean).join(', ')}
                                </p>
                              </button>
                            ))
                          )
                        ) : bucketList.length > 0 ? (
                          <>
                            <div className="px-3 py-2 text-xs font-medium text-muted border-b border-border-light">
                              Recent places
                            </div>
                            {bucketList.slice(0, 5).map((item) =>
                              item.place ? (
                                <button
                                  key={item.place._id}
                                  type="button"
                                  onClick={() => {
                                    setPlaceId(item.place!._id);
                                    setPlaceSearchTerm('');
                                    setShowPlaceDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-border-light transition-colors"
                                >
                                  <p className="font-medium text-foreground">{item.place.name}</p>
                                  <p className="text-sm text-muted">
                                    {[item.place.city, item.place.country].filter(Boolean).join(', ')}
                                  </p>
                                </button>
                              ) : null,
                            )}
                          </>
                        ) : (
                          <div className="p-3 text-center text-muted">Type to search places</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {placeId && (
              <div className="p-4 rounded-xl bg-info/5 border border-info/20">
                <div className="flex items-center gap-2 mb-2">
                  <Cloud size={16} className="text-info" />
                  <span className="text-sm font-medium text-foreground">Weather on that day</span>
                </div>
                {isLoadingWeather ? (
                  <div className="flex items-center gap-2 text-muted">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Fetching weather data...</span>
                  </div>
                ) : weather ? (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{weather.icon}</span>
                    <div>
                      <p className="font-semibold text-foreground">{formatTemperature(weather.temperature)}</p>
                      <p className="text-sm text-muted">{weather.condition}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted">
                    {entryDate > new Date().toISOString().split('T')[0]
                      ? 'Cannot get weather for future dates'
                      : 'Weather data not available for this location/date'}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
              <Link to="/journal">
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                disabled={!hasContent() || isSubmitting}
                leftIcon={isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              >
                Save Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export const Route = createFileRoute('/_authenticated/journal/new')({
  component: NewJournalEntryPage,
});
