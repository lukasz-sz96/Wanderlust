import { createFileRoute } from '@tanstack/react-router';
import { Compass, Sparkles } from 'lucide-react';
import { Button, Card, CardContent } from '../../../components/ui';

export const Route = createFileRoute('/_authenticated/places/discover')({
  component: DiscoverPage,
});

const DiscoverPage = () => (
  <div className="p-6 max-w-6xl mx-auto">
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Discover</h1>
        <p className="text-muted">AI-powered place recommendations</p>
      </div>
    </div>

    <Card>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-secondary-light/20 flex items-center justify-center mb-4">
            <Compass className="text-secondary" size={40} />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Discover new places
          </h3>
          <p className="text-muted mb-6 max-w-sm">
            Let AI help you find amazing destinations based on your interests
          </p>
          <Button variant="secondary" leftIcon={<Sparkles size={18} />}>
            Get Recommendations
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);
