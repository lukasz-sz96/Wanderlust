import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Button, Card, CardContent, Badge, PageLoading } from '../../../components/ui';
import {
  BookOpen,
  Plus,
  Calendar,
  MapPin,
  Plane,
  Image,
  Smile,
  Meh,
  Frown,
  Star,
} from 'lucide-react';

export const Route = createFileRoute('/_authenticated/journal/')({
  component: JournalPage,
});

const JournalPage = () => {
  const entries = useQuery(api.journal.list, {});
  const stats = useQuery(api.journal.getStats);

  if (entries === undefined || stats === undefined) {
    return <PageLoading message="Loading journal..." />;
  }

  const getMoodIcon = (mood?: string) => {
    switch (mood) {
      case 'amazing':
        return <Star className="text-warning" size={16} />;
      case 'good':
        return <Smile className="text-secondary" size={16} />;
      case 'neutral':
        return <Meh className="text-muted" size={16} />;
      case 'challenging':
        return <Frown className="text-primary" size={16} />;
      default:
        return null;
    }
  };

  const getMoodLabel = (mood?: string) => {
    switch (mood) {
      case 'amazing':
        return 'Amazing';
      case 'good':
        return 'Good';
      case 'neutral':
        return 'Neutral';
      case 'challenging':
        return 'Challenging';
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getContentPreview = (content: unknown): string => {
    if (!content) return '';
    if (typeof content === 'string') return content.slice(0, 150);
    if (typeof content === 'object' && content !== null) {
      const doc = content as { content?: Array<{ content?: Array<{ text?: string }> }> };
      if (doc.content) {
        const text = doc.content
          .flatMap((node) => node.content?.map((n) => n.text) || [])
          .filter(Boolean)
          .join(' ');
        return text.slice(0, 150);
      }
    }
    return '';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Journal</h1>
          <p className="text-muted">Document your travel memories</p>
        </div>
        <Link to="/journal/new">
          <Button leftIcon={<Plus size={18} />}>New Entry</Button>
        </Link>
      </div>

      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="text-center py-4">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted">Total Entries</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-4">
              <p className="text-2xl font-bold text-foreground">{stats.thisMonth}</p>
              <p className="text-sm text-muted">This Month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-4">
              <p className="text-2xl font-bold text-foreground">{stats.withPhotos}</p>
              <p className="text-sm text-muted">With Photos</p>
            </CardContent>
          </Card>
        </div>
      )}

      {entries.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                <BookOpen className="text-accent" size={40} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No journal entries</h3>
              <p className="text-muted mb-6 max-w-sm">
                Capture your travel experiences with photos and stories
              </p>
              <Link to="/journal/new">
                <Button leftIcon={<Plus size={18} />}>Write Your First Entry</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Link key={entry._id} to="/journal/$entryId" params={{ entryId: entry._id }}>
              <Card hoverable>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="text-accent" size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-lg">
                          {entry.title || 'Untitled Entry'}
                        </h3>
                        {entry.mood && (
                          <div className="flex items-center gap-1">
                            {getMoodIcon(entry.mood)}
                            <span className="text-sm text-muted">{getMoodLabel(entry.mood)}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-muted flex items-center gap-1 mb-2">
                        <Calendar size={14} />
                        {formatDate(entry.entryDate)}
                      </p>

                      {getContentPreview(entry.content) && (
                        <p className="text-muted text-sm line-clamp-2 mb-3">
                          {getContentPreview(entry.content)}...
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        {entry.trip && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Plane size={12} />
                            {entry.trip.title}
                          </Badge>
                        )}
                        {entry.place && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <MapPin size={12} />
                            {entry.place.name}
                          </Badge>
                        )}
                        {entry.photoCount > 0 && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Image size={12} />
                            {entry.photoCount} {entry.photoCount === 1 ? 'photo' : 'photos'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
