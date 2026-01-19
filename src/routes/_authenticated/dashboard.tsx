import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { useState } from 'react';
import { api } from '../../../convex/_generated/api';
import { useCurrentUser } from '../../lib/hooks/useUserSync';
import { useOnboarding } from '../../lib/hooks/useOnboarding';
import { MapView } from '../../components/maps';
import { Card, Badge, Button } from '../../components/ui';
import { AddPlaceModal } from '../../components/places';
import { OnboardingModal } from '../../components/onboarding';
import {
  MapPin,
  Plane,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Plus,
  Heart,
  CheckCircle,
  Star,
} from 'lucide-react';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});

const DashboardPage = () => {
  const user = useCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { showOnboarding, completeOnboarding } = useOnboarding();

  const bucketListItems = useQuery(api.bucketList.list, {});
  const stats = useQuery(api.bucketList.getStats, {});

  const greeting = getGreeting();
  const displayName = user?.displayName?.split(' ')[0] || 'Traveler';

  const markers =
    bucketListItems
      ?.filter((item) => item.place)
      .map((item) => ({
        id: item._id,
        latitude: item.place!.latitude,
        longitude: item.place!.longitude,
        label: item.place!.name,
        color: item.status === 'visited' ? '#81B29A' : '#E07A5F',
      })) ?? [];

  const defaultCenter = markers.length > 0
    ? { lat: markers[0].latitude, lng: markers[0].longitude }
    : { lat: 48.8566, lng: 2.3522 };

  return (
    <div className="h-[calc(100vh-4rem)] flex relative">
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
              <StatMini
                icon={<MapPin size={16} />}
                value={stats?.total ?? 0}
                label="Places"
                color="primary"
              />
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
              <StatMini
                icon={<MapPin size={16} />}
                value={stats?.countries ?? 0}
                label="Countries"
                color="accent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">Your Places</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Plus size={14} />}
                  onClick={() => setShowAddModal(true)}
                >
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
                      <Link
                        key={item._id}
                        to="/places/$placeId"
                        params={{ placeId: item.place._id }}
                        className="block"
                      >
                        <div className="p-3 rounded-lg border border-border-light hover:border-primary hover:bg-primary-light/5 transition-colors">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                item.status === 'visited'
                                  ? 'bg-secondary/20'
                                  : 'bg-primary-light/20'
                              }`}
                            >
                              <MapPin
                                size={16}
                                className={
                                  item.status === 'visited' ? 'text-secondary' : 'text-primary'
                                }
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">
                                {item.place.name}
                              </p>
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
                    ) : null
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

      <div className="flex-1 relative">
        <MapView
          latitude={defaultCenter.lat}
          longitude={defaultCenter.lng}
          zoom={markers.length > 0 ? 4 : 3}
          markers={markers}
          className="h-full"
        />

        {markers.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-64">
            <Card className="bg-surface/95 backdrop-blur-sm">
              <div className="p-3">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-muted">Want to visit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-secondary" />
                    <span className="text-muted">Visited</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
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
      <div className={`w-7 h-7 rounded-md flex items-center justify-center ${colorClasses[color]}`}>
        {icon}
      </div>
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
