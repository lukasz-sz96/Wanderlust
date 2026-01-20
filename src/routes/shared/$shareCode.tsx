import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AnimatedPage, Card, CardContent, PageLoading, Avatar, Button } from '../../components/ui';
import {
  MapPin,
  Calendar,
  Compass,
  Eye,
  Clock,
  ArrowRight,
  MapPinOff,
} from 'lucide-react';
import { format } from 'date-fns';

export const Route = createFileRoute('/shared/$shareCode')({
  component: SharedTripPage,
});

function SharedTripPage() {
  const { shareCode } = Route.useParams();
  const sharedTrip = useQuery(api.sharing.getSharedTrip, { shareCode });
  const incrementView = useMutation(api.sharing.incrementViewCount);

  useEffect(() => {
    if (shareCode) {
      incrementView({ shareCode });
    }
  }, [shareCode, incrementView]);

  if (sharedTrip === undefined) {
    return <PageLoading />;
  }

  if (sharedTrip === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center mx-auto mb-4">
            <MapPinOff size={40} className="text-muted" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Trip not found
          </h2>
          <p className="text-muted max-w-sm mb-6">
            This shared trip doesn't exist or has been removed
          </p>
          <Link to="/">
            <Button variant="outline">Go to Homepage</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const { trip, owner, itineraryItems, viewCount, showBranding } = sharedTrip;

  // Group itinerary by day
  type ItineraryItem = (typeof itineraryItems)[number];
  const dayGroups = itineraryItems.reduce(
    (acc, item) => {
      if (!acc[item.dayNumber]) {
        acc[item.dayNumber] = [];
      }
      acc[item.dayNumber].push(item);
      return acc;
    },
    {} as Record<number, ItineraryItem[]>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border-light bg-surface sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <Compass className="text-white" size={18} />
            </div>
            <span className="font-semibold text-foreground">Wanderlust</span>
          </Link>

          <div className="flex items-center gap-2 text-muted text-sm">
            <Eye size={14} />
            {viewCount} {viewCount === 1 ? 'view' : 'views'}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <AnimatedPage>
          {/* Trip Header */}
          <Card padding="none" className="overflow-hidden">
            {trip.coverImageUrl && (
              <div
                className="h-48 sm:h-64 bg-cover bg-center"
                style={{ backgroundImage: `url(${trip.coverImageUrl})` }}
              />
            )}
            {!trip.coverImageUrl && (
              <div className="h-32 bg-gradient-to-br from-primary via-primary-light to-secondary" />
            )}
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {trip.title}
                  </h1>
                  {trip.destination && (
                    <p className="text-muted flex items-center gap-1.5 mt-2">
                      <MapPin size={14} className="text-primary" />
                      {trip.destination.name}
                    </p>
                  )}
                  {(trip.startDate || trip.endDate) && (
                    <p className="text-muted flex items-center gap-1.5 mt-1">
                      <Calendar size={14} className="text-secondary" />
                      {trip.startDate && format(new Date(trip.startDate), 'MMM d')}
                      {trip.startDate && trip.endDate && ' - '}
                      {trip.endDate && format(new Date(trip.endDate), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 bg-border-light/50 rounded-xl">
                  <Avatar
                    src={owner.avatarUrl}
                    alt={owner.displayName || 'User'}
                    size="md"
                  />
                  <div>
                    <span className="font-medium text-foreground">
                      {owner.displayName || 'Traveler'}
                    </span>
                    <p className="text-sm text-muted">Trip creator</p>
                  </div>
                </div>
              </div>

              {trip.description && (
                <p className="mt-4 text-muted leading-relaxed">{trip.description}</p>
              )}
            </CardContent>
          </Card>

          {/* Itinerary */}
          <div className="mt-8 space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Itinerary</h2>

            {Object.keys(dayGroups).length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted">
                  No itinerary items yet
                </CardContent>
              </Card>
            ) : (
              Object.entries(dayGroups)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([day, items]) => (
                  <motion.div
                    key={day}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Number(day) * 0.1 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm text-primary">
                            {day}
                          </span>
                          Day {day}
                        </h3>
                        <div className="space-y-3">
                          {items
                            .sort((a, b) => a.orderIndex - b.orderIndex)
                            .map((item) => (
                              <div
                                key={item._id}
                                className="flex items-start gap-3 p-3 bg-border-light/50 rounded-lg hover:bg-border-light transition-colors"
                              >
                                <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                                  <MapPin size={16} className="text-secondary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground">
                                    {item.place.name}
                                  </p>
                                  {item.place.city && (
                                    <p className="text-sm text-muted">
                                      {item.place.city}
                                      {item.place.country && `, ${item.place.country}`}
                                    </p>
                                  )}
                                  {item.startTime && (
                                    <p className="text-sm text-muted flex items-center gap-1 mt-1">
                                      <Clock size={12} />
                                      {item.startTime}
                                      {item.durationMinutes && ` (${item.durationMinutes} min)`}
                                    </p>
                                  )}
                                  {item.notes && (
                                    <p className="text-sm text-muted mt-2 italic">{item.notes}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
            )}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="mt-8 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 border-primary/20">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Plan your own adventure
                </h3>
                <p className="text-muted mb-6 max-w-md mx-auto">
                  Create your travel bucket list and plan amazing trips with Wanderlust
                </p>
                <Link to="/signup">
                  <Button size="lg" rightIcon={<ArrowRight size={18} />}>
                    Get Started Free
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Branding Footer */}
          {showBranding && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-center text-sm text-muted"
            >
              Made with{' '}
              <Link to="/" className="text-primary hover:underline font-medium">
                Wanderlust
              </Link>
            </motion.div>
          )}
        </AnimatedPage>
      </main>
    </div>
  );
}
