import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../../../convex/_generated/api';
import { useCurrentUser } from '../../lib/hooks/useUserSync';
import { useOnboarding } from '../../lib/hooks/useOnboarding';
import { MapView, MapPlacePopup, MapDiscoverToggle, type PlacePopupData, type MarkerClickEvent } from '../../components/maps';
import { Card, Button } from '../../components/ui';
import { AddPlaceModal } from '../../components/places';
import { OnboardingModal } from '../../components/onboarding';
import { MapPin, Plane, BookOpen, ChevronLeft, ChevronRight, Plus, Heart, CheckCircle, Star, Eye, Users } from 'lucide-react';

type MapMode = 'my-places' | 'discover';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});

const DashboardPage = () => {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { showOnboarding, completeOnboarding } = useOnboarding();
  const [greeting, setGreeting] = useState('Hello');
  const [selectedPlace, setSelectedPlace] = useState<PlacePopupData | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | undefined>();
  const [mapMode, setMapMode] = useState<MapMode>('my-places');
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  const bucketListItems = useQuery(api.bucketList.list, {});
  const stats = useQuery(api.bucketList.getStats, {});
  const placesWithPublicPhotos = useQuery(api.photos.getPlacesWithPublicPhotos, {});
  const communityPlaces = useQuery(
    api.places.listCommunityPlaces,
    mapMode === 'discover' ? { limit: 100 } : 'skip'
  );

  const publicPlaceIds = useMemo(
    () => new Set(placesWithPublicPhotos ?? []),
    [placesWithPublicPhotos]
  );

  const displayName = user?.displayName?.split(' ')[0] || 'Traveler';

  const myPlaceIds = useMemo(
    () => new Set(bucketListItems?.map((item) => item.place?._id).filter(Boolean) ?? []),
    [bucketListItems]
  );

  const myMarkers = useMemo(
    () =>
      bucketListItems
        ?.filter((item) => item.place)
        .map((item) => ({
          id: item.place!._id,
          latitude: item.place!.latitude,
          longitude: item.place!.longitude,
          label: item.place!.name,
          color: item.status === 'visited' ? '#81B29A' : '#E07A5F',
          hasPublicContent: publicPlaceIds.has(item.place!._id),
        })) ?? [],
    [bucketListItems, publicPlaceIds]
  );

  const communityMarkers = useMemo(() => {
    if (mapMode !== 'discover' || !communityPlaces) return [];
    return communityPlaces
      .filter((place) => !myPlaceIds.has(place._id))
      .map((place) => ({
        id: `community-${place._id}`,
        latitude: place.latitude,
        longitude: place.longitude,
        label: place.name,
        color: '#9C89B8',
        isCommunity: true,
        photoCount: place.photoCount,
        previewUrl: place.previewUrl,
      }));
  }, [mapMode, communityPlaces, myPlaceIds]);

  const markers = useMemo(
    () => [...myMarkers, ...communityMarkers],
    [myMarkers, communityMarkers]
  );

  const handleMarkerClick = (event: MarkerClickEvent) => {
    if (event.markerId.startsWith('community-')) {
      const placeId = event.markerId.replace('community-', '');
      navigate({ to: '/places/$placeId', params: { placeId } });
      return;
    }

    const bucketItem = bucketListItems?.find((item) => item.place?._id === event.markerId);
    if (bucketItem?.place) {
      setSelectedPlace({
        id: bucketItem.place._id,
        name: bucketItem.place.name,
        city: bucketItem.place.city,
        country: bucketItem.place.country,
        latitude: bucketItem.place.latitude,
        longitude: bucketItem.place.longitude,
        status: bucketItem.status,
        rating: bucketItem.rating,
        category: bucketItem.place.category,
      });
      setPopupPosition(event.position);
    }
  };

  const handleClosePopup = () => {
    setSelectedPlace(null);
    setPopupPosition(undefined);
  };

  const defaultCenter =
    markers.length > 0 ? { lat: markers[0].latitude, lng: markers[0].longitude } : { lat: 48.8566, lng: 2.3522 };

  return (
    <div className="h-full flex relative">
      <div
        className={`
          absolute lg:relative z-20 h-full bg-surface border-r border-border-light
          transition-all duration-300 ease-in-out overflow-hidden
          ${sidebarOpen ? 'w-80' : 'w-0 lg:w-0'}
        `}
      >
        <div className="w-80 h-full flex flex-col">
          <div className="p-4 border-b border-border-light">
            <h2 className="text-lg font-semibold text-foreground">
              {greeting}, {displayName}!
            </h2>
            <p className="text-sm text-muted">Your travel map</p>
          </div>

          <div className="p-4 border-b border-border-light">
            <div className="grid grid-cols-2 gap-3">
              <StatMini icon={<MapPin size={16} />} value={stats?.total ?? 0} label="Places" color="primary" />
              <StatMini
                icon={<CheckCircle size={16} />}
                value={stats?.visited ?? 0}
                label="Visited"
                color="secondary"
              />
              <StatMini
                icon={<Heart size={16} />}
                value={stats?.wantToVisit ?? 0}
                label="Want to visit"
                color="primary"
              />
              <StatMini icon={<MapPin size={16} />} value={stats?.countries ?? 0} label="Countries" color="accent" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">Your Places</h3>
                <Button size="sm" variant="ghost" leftIcon={<Plus size={14} />} onClick={() => setShowAddModal(true)}>
                  Add
                </Button>
              </div>

              {bucketListItems === undefined ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-border-light rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : bucketListItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-border-light flex items-center justify-center mx-auto mb-3">
                    <MapPin className="text-muted" size={24} />
                  </div>
                  <p className="text-sm text-muted mb-3">No places yet</p>
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Plus size={14} />}
                    onClick={() => setShowAddModal(true)}
                  >
                    Add Your First Place
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {bucketListItems.map((item) =>
                    item.place ? (
                      <Link key={item._id} to="/places/$placeId" params={{ placeId: item.place._id }} className="block">
                        <div className="p-3 rounded-lg border border-border-light hover:border-primary hover:bg-primary-light/5 transition-colors">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                item.status === 'visited' ? 'bg-secondary/20' : 'bg-primary-light/20'
                              }`}
                            >
                              <MapPin
                                size={16}
                                className={item.status === 'visited' ? 'text-secondary' : 'text-primary'}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">{item.place.name}</p>
                              <p className="text-xs text-muted truncate">
                                {[item.place.city, item.place.country].filter(Boolean).join(', ')}
                              </p>
                            </div>
                            {item.status === 'visited' && item.rating && (
                              <div className="flex items-center gap-1 text-warning">
                                <Star size={12} className="fill-current" />
                                <span className="text-xs font-medium">{item.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ) : null,
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-border-light">
            <div className="grid grid-cols-2 gap-2">
              <Link to="/trips">
                <Button variant="ghost" className="w-full justify-start" leftIcon={<Plane size={16} />}>
                  Trips
                </Button>
              </Link>
              <Link to="/journal">
                <Button variant="ghost" className="w-full justify-start" leftIcon={<BookOpen size={16} />}>
                  Journal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`
          absolute z-30 top-4 bg-surface border border-border-light rounded-lg p-2
          shadow-md hover:bg-border-light transition-all duration-300
          ${sidebarOpen ? 'left-[19rem]' : 'left-4'}
        `}
      >
        {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      <div className="flex-1 relative" ref={mapContainerRef}>
        <MapView
          latitude={defaultCenter.lat}
          longitude={defaultCenter.lng}
          zoom={markers.length > 0 ? 4 : 3}
          markers={markers}
          className="h-full"
          onMarkerClick={handleMarkerClick}
        />

        <MapPlacePopup
          place={selectedPlace}
          onClose={handleClosePopup}
          position={popupPosition}
          containerRef={mapContainerRef}
        />

        <div className="absolute top-4 left-4 z-10">
          <MapDiscoverToggle mode={mapMode} onChange={setMapMode} />
        </div>

        <div className="absolute bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-auto">
          <Card className="bg-surface/95 backdrop-blur-sm">
            <div className="p-3">
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-muted">Want to visit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                  <span className="text-muted">Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye size={12} className="text-info" />
                  <span className="text-muted">Shared publicly</span>
                </div>
                {mapMode === 'discover' && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-[#9C89B8] bg-transparent" />
                    <span className="text-muted">Community</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <AddPlaceModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      <OnboardingModal isOpen={showOnboarding} onComplete={completeOnboarding} />
    </div>
  );
};

const StatMini = ({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: 'primary' | 'secondary' | 'accent';
}) => {
  const colorClasses = {
    primary: 'text-primary bg-primary-light/20',
    secondary: 'text-secondary bg-secondary/20',
    accent: 'text-accent bg-accent/20',
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-border-light/50">
      <div className={`w-7 h-7 rounded-md flex items-center justify-center ${colorClasses[color]}`}>{icon}</div>
      <div>
        <p className="text-lg font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
};

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};
