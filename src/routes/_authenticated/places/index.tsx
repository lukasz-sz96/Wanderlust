import { createFileRoute } from '@tanstack/react-router';
import { MapPin, Plus } from 'lucide-react';
import { Button, Card, CardContent } from '../../../components/ui';

export const Route = createFileRoute('/_authenticated/places/')({
  component: PlacesPage,
});

const PlacesPage = () => (
  <div className="p-6 max-w-6xl mx-auto">
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Places</h1>
        <p className="text-muted">Your bucket list of places to visit</p>
      </div>
      <Button leftIcon={<Plus size={18} />}>Add Place</Button>
    </div>

    <Card>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-light/20 flex items-center justify-center mb-4">
            <MapPin className="text-primary" size={40} />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No places yet
          </h3>
          <p className="text-muted mb-6 max-w-sm">
            Start building your bucket list by adding places you want to visit
          </p>
          <Button leftIcon={<Plus size={18} />}>Add Your First Place</Button>
        </div>
      </CardContent>
    </Card>
  </div>
);
