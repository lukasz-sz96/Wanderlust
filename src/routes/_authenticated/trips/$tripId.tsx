import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { useState } from 'react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { MapView } from '../../../components/maps';
import { Card, CardContent, Button, Badge, IconButton, PageLoading, Input } from '../../../components/ui';
import {
  ArrowLeft,
  Plane,
  MapPin,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Clock,
  Utensils,
  Car,
  Home,
  MoreHorizontal,
  GripVertical,
  CheckCircle,
  Share2,
} from 'lucide-react';
import { ShareTripModal } from '../../../components/social/ShareTripModal';

export const Route = createFileRoute('/_authenticated/trips/$tripId')({
  component: TripDetailPage,
});

const TripDetailPage = () => {
  const { tripId } = Route.useParams();
  const trip = useQuery(api.trips.get, { tripId: tripId as Id<'trips'> });
  const itineraryItems = useQuery(api.itinerary.listByTrip, { tripId: tripId as Id<'trips'> });
  const bucketListItems = useQuery(api.bucketList.list, { status: 'want_to_visit' });

  const updateTrip = useMutation(api.trips.update);
  const deleteTrip = useMutation(api.trips.remove);
  const addItineraryItem = useMutation(api.itinerary.add);
  const removeItineraryItem = useMutation(api.itinerary.remove);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);

  if (trip === undefined || itineraryItems === undefined) {
    return <PageLoading message="Loading trip..." />;
  }

  if (trip === null) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-border-light flex items-center justify-center mx-auto mb-4">
            <Plane className="text-muted" size={40} />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Trip not found</h2>
          <p className="text-muted mb-6">This trip may have been deleted or doesn't exist.</p>
          <Link to="/trips">
            <Button variant="primary">Back to Trips</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    await deleteTrip({ tripId: trip._id });
    window.location.href = '/trips';
  };

  const handleStatusChange = async (status: 'planning' | 'active' | 'completed') => {
    await updateTrip({ tripId: trip._id, status });
  };

  const handleAddPlace = async (placeId: Id<'places'>) => {
    await addItineraryItem({
      tripId: trip._id,
      placeId,
      dayNumber: selectedDay,
      category: 'activity',
    });
    setShowAddPlace(false);
  };

  const handleRemoveItem = async (itemId: Id<'itineraryItems'>) => {
    await removeItineraryItem({ itemId });
  };

  const getDaysCount = () => {
    if (!trip.startDate || !trip.endDate) return 3;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  };

  const daysCount = getDaysCount();
  const days = Array.from({ length: daysCount }, (_, i) => i + 1);

  const getItemsByDay = (day: number) => itineraryItems.filter((item) => item.dayNumber === day);

  const markers = itineraryItems
    .filter((item) => item.place)
    .map((item) => ({
      id: item._id,
      latitude: item.place!.latitude,
      longitude: item.place!.longitude,
      label: item.place!.name,
    }));

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'meal':
        return <Utensils size={14} />;
      case 'transport':
        return <Car size={14} />;
      case 'accommodation':
        return <Home size={14} />;
      default:
        return <MapPin size={14} />;
    }
  };

  const formatDate = (dateStr: string, day: number) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + day - 1);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link to="/trips" className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors">
          <ArrowLeft size={18} />
          Back to Trips
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">{trip.title}</h1>
                  {trip.destination && (
                    <p className="text-muted flex items-center gap-2">
                      <MapPin size={16} />
                      {trip.destination.name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={trip.status === 'completed' ? 'success' : trip.status === 'active' ? 'primary' : 'default'}
                  >
                    {trip.status}
                  </Badge>
                </div>
              </div>

              {(trip.startDate || trip.endDate) && (
                <p className="text-sm text-muted flex items-center gap-2 mb-4">
                  <Calendar size={16} />
                  {trip.startDate} {trip.endDate && `- ${trip.endDate}`}
                </p>
              )}

              {trip.description && <p className="text-muted mb-4">{trip.description}</p>}

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={trip.status === 'planning' ? 'primary' : 'ghost'}
                  onClick={() => handleStatusChange('planning')}
                >
                  Planning
                </Button>
                <Button
                  size="sm"
                  variant={trip.status === 'active' ? 'primary' : 'ghost'}
                  onClick={() => handleStatusChange('active')}
                >
                  Active
                </Button>
                <Button
                  size="sm"
                  variant={trip.status === 'completed' ? 'primary' : 'ghost'}
                  leftIcon={<CheckCircle size={14} />}
                  onClick={() => handleStatusChange('completed')}
                >
                  Completed
                </Button>
                <div className="flex-1" />
                <IconButton variant="ghost" size="sm" label="Share trip" onClick={() => setShowShareModal(true)}>
                  <Share2 size={16} />
                </IconButton>
                <IconButton variant="danger" size="sm" label="Delete trip" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 size={16} />
                </IconButton>
              </div>
            </CardContent>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Itinerary</h2>
              <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowAddPlace(true)}>
                Add Activity
              </Button>
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`
                    px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors
                    ${
                      selectedDay === day
                        ? 'bg-secondary text-white'
                        : 'bg-surface border border-border-light text-muted hover:text-foreground'
                    }
                  `}
                >
                  Day {day}
                  {trip.startDate && (
                    <span className="block text-xs opacity-75">{formatDate(trip.startDate, day)}</span>
                  )}
                </button>
              ))}
            </div>

            <Card>
              <CardContent>
                {getItemsByDay(selectedDay).length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-border-light flex items-center justify-center mx-auto mb-3">
                      <Calendar className="text-muted" size={24} />
                    </div>
                    <p className="text-muted mb-3">No activities for Day {selectedDay}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Plus size={14} />}
                      onClick={() => setShowAddPlace(true)}
                    >
                      Add Activity
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getItemsByDay(selectedDay).map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border-light hover:border-secondary transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{item.place?.name || 'Unknown place'}</p>
                          <div className="flex items-center gap-2 text-sm text-muted">
                            {item.startTime && (
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {item.startTime}
                              </span>
                            )}
                            {item.place?.city && <span>{item.place.city}</span>}
                          </div>
                        </div>
                        <IconButton variant="ghost" size="sm" label="Remove" onClick={() => handleRemoveItem(item._id)}>
                          <Trash2 size={14} />
                        </IconButton>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card padding="none" className="overflow-hidden">
            <div className="h-64">
              <MapView
                latitude={trip.destination?.latitude || 48.8566}
                longitude={trip.destination?.longitude || 2.3522}
                zoom={markers.length > 0 ? 10 : 5}
                markers={markers}
                className="h-full"
              />
            </div>
          </Card>

          <Card>
            <CardContent>
              <h3 className="font-semibold text-foreground mb-3">Trip Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Days</span>
                  <span className="font-medium text-foreground">{daysCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Activities</span>
                  <span className="font-medium text-foreground">{itineraryItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Places</span>
                  <span className="font-medium text-foreground">
                    {new Set(itineraryItems.map((i) => i.placeId)).size}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showAddPlace && bucketListItems && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddPlace(false)} />
          <Card className="relative z-10 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border-light">
              <h2 className="text-lg font-semibold text-foreground">Add to Day {selectedDay}</h2>
              <button
                onClick={() => setShowAddPlace(false)}
                className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-border-light transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {bucketListItems.length === 0 ? (
                <p className="text-center text-muted py-8">No places in your bucket list. Add some places first!</p>
              ) : (
                <div className="space-y-2">
                  {bucketListItems.map((item) =>
                    item.place ? (
                      <button
                        key={item._id}
                        onClick={() => handleAddPlace(item.place!._id)}
                        className="w-full text-left p-3 rounded-lg border border-border-light hover:border-secondary hover:bg-secondary/5 transition-colors"
                      >
                        <p className="font-medium text-foreground">{item.place.name}</p>
                        <p className="text-sm text-muted">
                          {[item.place.city, item.place.country].filter(Boolean).join(', ')}
                        </p>
                      </button>
                    ) : null,
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
          <Card className="relative z-10 w-full max-w-md">
            <CardContent className="text-center">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-error" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Delete Trip?</h3>
              <p className="text-muted mb-6">
                This will permanently delete "{trip.title}" and all its itinerary items.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <ShareTripModal
        tripId={trip._id}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
};
