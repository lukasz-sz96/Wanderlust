import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { useState } from 'react';
import { api } from '../../../../convex/_generated/api';
import { Button, Card, CardContent, Badge, PageLoading } from '../../../components/ui';
import { Plane, Plus, MapPin, Calendar, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { CreateTripModal } from '../../../components/trips';

export const Route = createFileRoute('/_authenticated/trips/')({
  component: TripsPage,
});

type TabType = 'all' | 'planning' | 'active' | 'completed';

const TripsPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const trips = useQuery(
    api.trips.list,
    activeTab === 'all' ? {} : { status: activeTab }
  );
  const stats = useQuery(api.trips.getStats);

  if (trips === undefined || stats === undefined) {
    return <PageLoading message="Loading trips..." />;
  }

  const tabs = [
    { id: 'all' as TabType, label: 'All', count: stats.total, icon: Plane },
    { id: 'planning' as TabType, label: 'Planning', count: stats.planning, icon: Clock },
    { id: 'active' as TabType, label: 'Active', count: stats.active, icon: MapPin },
    { id: 'completed' as TabType, label: 'Completed', count: stats.completed, icon: CheckCircle },
  ];

  const formatDateRange = (start?: string, end?: string) => {
    if (!start) return null;
    const startDate = new Date(start);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (!end) return startDate.toLocaleDateString('en-US', options);
    const endDate = new Date(end);
    if (startDate.getMonth() === endDate.getMonth()) {
      return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.getDate()}`;
    }
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Trips</h1>
          <p className="text-muted">Plan and organize your travels</p>
        </div>
        <Button leftIcon={<Plus size={18} />} onClick={() => setShowCreateModal(true)}>
          New Trip
        </Button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap
                font-medium transition-colors duration-200
                ${isActive
                  ? 'bg-secondary text-white'
                  : 'bg-surface border border-border text-muted hover:text-foreground hover:border-muted'
                }
              `}
            >
              <Icon size={16} />
              {tab.label}
              <span
                className={`
                  text-xs px-2 py-0.5 rounded-full
                  ${isActive ? 'bg-white/20' : 'bg-border-light'}
                `}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {trips.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                {activeTab === 'planning' ? (
                  <Clock className="text-secondary" size={40} />
                ) : activeTab === 'active' ? (
                  <MapPin className="text-secondary" size={40} />
                ) : activeTab === 'completed' ? (
                  <CheckCircle className="text-secondary" size={40} />
                ) : (
                  <Plane className="text-secondary" size={40} />
                )}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {activeTab === 'planning'
                  ? 'No trips in planning'
                  : activeTab === 'active'
                    ? 'No active trips'
                    : activeTab === 'completed'
                      ? 'No completed trips'
                      : 'No trips yet'}
              </h3>
              <p className="text-muted mb-6 max-w-sm">
                {activeTab === 'all'
                  ? 'Start planning your next adventure with detailed itineraries'
                  : 'Trips will appear here as you create and progress through them'}
              </p>
              {activeTab === 'all' && (
                <Button leftIcon={<Plus size={18} />} onClick={() => setShowCreateModal(true)}>
                  Plan Your First Trip
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <Link key={trip._id} to="/trips/$tripId" params={{ tripId: trip._id }}>
              <Card hoverable className="h-full">
                <div className="p-0">
                  {trip.coverImageUrl ? (
                    <div className="h-40 bg-border-light rounded-t-xl overflow-hidden">
                      <img
                        src={trip.coverImageUrl}
                        alt={trip.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-t-xl flex items-center justify-center">
                      <Plane className="text-secondary/40" size={48} />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-foreground text-lg line-clamp-1">
                        {trip.title}
                      </h3>
                      <Badge
                        variant={
                          trip.status === 'completed'
                            ? 'success'
                            : trip.status === 'active'
                              ? 'primary'
                              : 'default'
                        }
                      >
                        {trip.status === 'planning'
                          ? 'Planning'
                          : trip.status === 'active'
                            ? 'Active'
                            : 'Completed'}
                      </Badge>
                    </div>

                    {trip.destination && (
                      <p className="text-sm text-muted flex items-center gap-1 mb-2">
                        <MapPin size={14} />
                        {trip.destination.name}
                      </p>
                    )}

                    {(trip.startDate || trip.endDate) && (
                      <p className="text-sm text-muted flex items-center gap-1 mb-3">
                        <Calendar size={14} />
                        {formatDateRange(trip.startDate, trip.endDate)}
                      </p>
                    )}

                    {trip.description && (
                      <p className="text-sm text-muted line-clamp-2 mb-3">
                        {trip.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border-light">
                      <span className="text-sm text-muted">
                        {trip.itemCount} {trip.itemCount === 1 ? 'activity' : 'activities'}
                      </span>
                      <span className="text-primary flex items-center gap-1 text-sm font-medium">
                        View <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateTripModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
};
