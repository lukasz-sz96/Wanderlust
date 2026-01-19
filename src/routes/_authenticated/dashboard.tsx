import { createFileRoute } from '@tanstack/react-router';
import { useCurrentUser } from '../../lib/hooks/useUserSync';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui';
import { MapPin, Plane, BookOpen, Compass } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});

const DashboardPage = () => {
  const user = useCurrentUser();

  const greeting = getGreeting();
  const displayName = user?.displayName?.split(' ')[0] || 'Traveler';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {greeting}, {displayName}!
        </h1>
        <p className="text-muted">
          Ready to plan your next adventure?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<MapPin className="text-primary" size={24} />}
          label="Places"
          value="0"
          sublabel="in bucket list"
        />
        <StatCard
          icon={<Plane className="text-secondary" size={24} />}
          label="Trips"
          value="0"
          sublabel="planned"
        />
        <StatCard
          icon={<BookOpen className="text-accent" size={24} />}
          label="Journal"
          value="0"
          sublabel="entries"
        />
        <StatCard
          icon={<Compass className="text-info" size={24} />}
          label="Visited"
          value="0"
          sublabel="countries"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-border-light flex items-center justify-center mb-4">
                <Compass className="text-muted" size={32} />
              </div>
              <p className="text-muted mb-2">No recent activity</p>
              <p className="text-sm text-muted-light">
                Start by adding places to your bucket list
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-border-light flex items-center justify-center mb-4">
                <Plane className="text-muted" size={32} />
              </div>
              <p className="text-muted mb-2">No upcoming trips</p>
              <p className="text-sm text-muted-light">
                Plan your next adventure
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
}) => (
  <Card hoverable>
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-border-light flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted">
          {label} <span className="text-muted-light">{sublabel}</span>
        </p>
      </div>
    </div>
  </Card>
);

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};
