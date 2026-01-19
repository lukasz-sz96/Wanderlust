import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { useState, useEffect } from 'react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import {
  Button,
  Card,
  CardContent,
  Input,
  Textarea,
  PageLoading,
} from '../../../components/ui';
import {
  ArrowLeft,
  Save,
  Calendar,
  MapPin,
  Plane,
  Star,
  Smile,
  Meh,
  Frown,
  Loader2,
  Cloud,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { fetchHistoricalWeather, formatTemperature, type HistoricalWeather } from '../../../lib/api/weather';

export const Route = createFileRoute('/_authenticated/journal/new')({
  component: NewJournalEntryPage,
});

type Mood = 'amazing' | 'good' | 'neutral' | 'challenging';

const NewJournalEntryPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState<Mood | undefined>();
  const [tripId, setTripId] = useState<Id<'trips'> | undefined>();
  const [placeId, setPlaceId] = useState<Id<'places'> | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weather, setWeather] = useState<HistoricalWeather | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  const trips = useQuery(api.trips.list, {});
  const bucketList = useQuery(api.bucketList.list, {});
  const createEntry = useMutation(api.journal.create);

  const selectedPlace = bucketList?.find((item) => item.place?._id === placeId)?.place;

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
      const data = await fetchHistoricalWeather(
        selectedPlace.latitude,
        selectedPlace.longitude,
        entryDate
      );
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
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const entryId = await createEntry({
        title: title.trim() || undefined,
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: content }] }] },
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

  const moods: { id: Mood; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'amazing', label: 'Amazing', icon: <Star size={20} />, color: 'text-warning bg-warning/10 border-warning' },
    { id: 'good', label: 'Good', icon: <Smile size={20} />, color: 'text-secondary bg-secondary/10 border-secondary' },
    { id: 'neutral', label: 'Neutral', icon: <Meh size={20} />, color: 'text-muted bg-border-light border-border' },
    { id: 'challenging', label: 'Challenging', icon: <Frown size={20} />, color: 'text-primary bg-primary-light/10 border-primary' },
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

            <Input
              label="Date"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                How are you feeling?
              </label>
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

            <Textarea
              label="What happened today?"
              placeholder="Write about your experiences, thoughts, and memories..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Plane size={14} className="inline mr-1" />
                  Link to Trip (optional)
                </label>
                <select
                  value={tripId || ''}
                  onChange={(e) => setTripId(e.target.value ? e.target.value as Id<'trips'> : undefined)}
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <MapPin size={14} className="inline mr-1" />
                  Link to Place (optional)
                </label>
                <select
                  value={placeId || ''}
                  onChange={(e) => setPlaceId(e.target.value ? e.target.value as Id<'places'> : undefined)}
                  className="w-full px-3 py-2 rounded-lg border border-border-light bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">No place</option>
                  {bucketList.map((item) =>
                    item.place ? (
                      <option key={item.place._id} value={item.place._id}>
                        {item.place.name}
                      </option>
                    ) : null
                  )}
                </select>
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
                      <p className="font-semibold text-foreground">
                        {formatTemperature(weather.temperature)}
                      </p>
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
                disabled={!content.trim() || isSubmitting}
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
