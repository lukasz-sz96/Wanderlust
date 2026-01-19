import { createFileRoute } from '@tanstack/react-router';
import { Plane, Plus } from 'lucide-react';
import { Button, Card, CardContent } from '../../../components/ui';

export const Route = createFileRoute('/_authenticated/trips/')({
  component: TripsPage,
});

const TripsPage = () => (
  <div className="p-6 max-w-6xl mx-auto">
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Trips</h1>
        <p className="text-muted">Plan and organize your travels</p>
      </div>
      <Button leftIcon={<Plus size={18} />}>New Trip</Button>
    </div>

    <Card>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-secondary-light/20 flex items-center justify-center mb-4">
            <Plane className="text-secondary" size={40} />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No trips planned
          </h3>
          <p className="text-muted mb-6 max-w-sm">
            Start planning your next adventure with detailed itineraries
          </p>
          <Button leftIcon={<Plus size={18} />}>Plan Your First Trip</Button>
        </div>
      </CardContent>
    </Card>
  </div>
);
