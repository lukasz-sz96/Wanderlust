import { createFileRoute } from '@tanstack/react-router';
import { AnimatedPage } from '../../components/ui/AnimatedPage';
import { ActivityFeed } from '../../components/social/ActivityFeed';
import { Rss } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/feed')({
  component: FeedPage,
});

function FeedPage() {
  return (
    <AnimatedPage>
      <div className="p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Rss size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Activity Feed</h1>
              <p className="text-sm text-muted">See what travelers you follow are up to</p>
            </div>
          </div>

          {/* Feed */}
          <ActivityFeed />
        </div>
      </div>
    </AnimatedPage>
  );
}
