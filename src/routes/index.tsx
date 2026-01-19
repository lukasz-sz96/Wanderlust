import { createFileRoute, redirect } from '@tanstack/react-router';
import { getAuth, getSignInUrl, getSignUpUrl } from '@workos/authkit-tanstack-react-start';
import { MapPin, Plane, BookOpen, Star, ArrowRight } from 'lucide-react';
import { Button, Card } from '../components/ui';

export const Route = createFileRoute('/')({
  component: LandingPage,
  loader: async () => {
    const { user } = await getAuth();

    if (user) {
      throw redirect({ to: '/dashboard' });
    }

    const signInUrl = await getSignInUrl();
    const signUpUrl = await getSignUpUrl();

    return { signInUrl, signUpUrl };
  },
});

const LandingPage = () => {
  const { signInUrl, signUpUrl } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border-light">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <MapPin className="text-white" size={22} />
            </div>
            <span className="text-xl font-bold text-foreground">Wanderlust</span>
          </div>
          <div className="flex items-center gap-3">
            <a href={signInUrl}>
              <Button variant="ghost">Sign In</Button>
            </a>
            <a href={signUpUrl}>
              <Button variant="primary">Get Started</Button>
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Your travel dreams,{' '}
              <span className="text-primary">beautifully organized</span>
            </h1>
            <p className="text-xl text-muted mb-10 max-w-2xl mx-auto">
              Plan trips, track your bucket list, write travel journals, and discover
              new destinations — all in one cozy place.
            </p>
            <div className="flex items-center justify-center gap-4">
              <a href={signUpUrl}>
                <Button variant="primary" size="lg" rightIcon={<ArrowRight size={20} />}>
                  Start Planning
                </Button>
              </a>
              <a href={signInUrl}>
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </a>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-surface">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              Everything you need for your adventures
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard
                icon={<MapPin className="text-primary" size={28} />}
                title="Bucket List"
                description="Save places you dream of visiting and track the ones you've explored"
              />
              <FeatureCard
                icon={<Plane className="text-secondary" size={28} />}
                title="Trip Planning"
                description="Create detailed itineraries with day-by-day activities and maps"
              />
              <FeatureCard
                icon={<BookOpen className="text-accent" size={28} />}
                title="Travel Journal"
                description="Document your experiences with rich text entries and photos"
              />
              <FeatureCard
                icon={<Star className="text-warning" size={28} />}
                title="AI Discovery"
                description="Get personalized recommendations for your next adventure"
              />
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Ready to start your journey?
            </h2>
            <p className="text-lg text-muted mb-8">
              Join travelers who use Wanderlust to plan their perfect trips.
            </p>
            <a href={signUpUrl}>
              <Button variant="primary" size="lg" rightIcon={<ArrowRight size={20} />}>
                Create Free Account
              </Button>
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-light py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <MapPin className="text-white" size={16} />
            </div>
            <span className="font-semibold text-foreground">Wanderlust</span>
          </div>
          <p className="text-sm text-muted">Your cozy travel companion</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <Card hoverable className="text-center">
    <div className="p-6">
      <div className="w-14 h-14 rounded-xl bg-border-light flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted">{description}</p>
    </div>
  </Card>
);
