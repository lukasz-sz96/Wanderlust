import { Link, createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Calendar, Filter, Frown, Image, MapPin, Meh, Plane, Plus, Search, Smile, SortAsc, Star, X } from 'lucide-react';
import { api } from '../../../../convex/_generated/api';
import {
  AnimatedPage,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  SkeletonJournalEntry,
} from '../../../components/ui';
import { staggerContainer, staggerItem } from '../../../lib/animations';
import type { Id } from '../../../../convex/_generated/dataModel';

type Mood = 'amazing' | 'good' | 'neutral' | 'challenging';
type SortBy = 'recent' | 'oldest' | 'mood';

const JournalPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood | ''>('');
  const [selectedTrip, setSelectedTrip] = useState<Id<'trips'> | ''>('');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const entries = useQuery(api.journal.list, {});
  const stats = useQuery(api.journal.getStats);
  const trips = useQuery(api.trips.list, {});

  const { uniqueTrips, filteredEntries } = useMemo(() => {
    if (!entries) return { uniqueTrips: [], filteredEntries: [] };

    const tripMap = new Map<string, { id: Id<'trips'>; title: string }>();
    entries.forEach((entry) => {
      if (entry.trip) {
        tripMap.set(entry.trip._id, { id: entry.trip._id, title: entry.trip.title });
      }
    });

    let filtered = [...entries];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((entry) => {
        const titleMatch = entry.title?.toLowerCase().includes(query);
        const contentPreview = getContentText(entry.content);
        const contentMatch = contentPreview.toLowerCase().includes(query);
        const placeMatch = entry.place?.name.toLowerCase().includes(query);
        const tripMatch = entry.trip?.title.toLowerCase().includes(query);
        return titleMatch || contentMatch || placeMatch || tripMatch;
      });
    }

    if (selectedMood) {
      filtered = filtered.filter((entry) => entry.mood === selectedMood);
    }

    if (selectedTrip) {
      filtered = filtered.filter((entry) => entry.trip?._id === selectedTrip);
    }

    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
        break;
      case 'mood': {
        const moodOrder = { amazing: 0, good: 1, neutral: 2, challenging: 3 };
        filtered.sort((a, b) => {
          const moodA = a.mood ? moodOrder[a.mood] : 4;
          const moodB = b.mood ? moodOrder[b.mood] : 4;
          return moodA - moodB;
        });
        break;
      }
      default:
        filtered.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
    }

    return {
      uniqueTrips: Array.from(tripMap.values()),
      filteredEntries: filtered,
    };
  }, [entries, searchQuery, selectedMood, selectedTrip, sortBy]);

  const hasActiveFilters = selectedMood || selectedTrip || sortBy !== 'recent';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedMood('');
    setSelectedTrip('');
    setSortBy('recent');
  };

  const getContentText = (content: unknown): string => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
      const doc = content as { content?: Array<{ content?: Array<{ text?: string }> }> };
      if (doc.content) {
        return doc.content
          .flatMap((node) => node.content?.map((n) => n.text) || [])
          .filter(Boolean)
          .join(' ');
      }
    }
    return '';
  };

  if (entries === undefined || stats === undefined) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Journal</h1>
            <p className="text-muted">Document your travel memories</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonJournalEntry key={i} />
          ))}
        </div>
      </div>
    );
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
    if (typeof content === 'object') {
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
    <AnimatedPage className="p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Journal</h1>
          <p className="text-muted">Document your travel memories</p>
        </div>
        <Link to="/journal/new">
          <Button leftIcon={<Plus size={18} />}>New Entry</Button>
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2 rounded-lg border border-border bg-surface text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
            showFilters || hasActiveFilters
              ? 'bg-primary/10 border-primary text-primary'
              : 'border-border text-muted hover:text-foreground hover:border-muted'
          }`}
        >
          <Filter size={18} />
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted whitespace-nowrap">Mood:</label>
                    <select
                      value={selectedMood}
                      onChange={(e) => setSelectedMood(e.target.value as Mood | '')}
                      className="px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option value="">All moods</option>
                      <option value="amazing">Amazing</option>
                      <option value="good">Good</option>
                      <option value="neutral">Neutral</option>
                      <option value="challenging">Challenging</option>
                    </select>
                  </div>
                  {uniqueTrips.length > 0 && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted whitespace-nowrap">Trip:</label>
                      <select
                        value={selectedTrip}
                        onChange={(e) => setSelectedTrip(e.target.value as Id<'trips'> | '')}
                        className="px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      >
                        <option value="">All trips</option>
                        {uniqueTrips.map((trip) => (
                          <option key={trip.id} value={trip.id}>
                            {trip.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <SortAsc size={16} className="text-muted" />
                    <label className="text-sm text-muted whitespace-nowrap">Sort:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortBy)}
                      className="px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="oldest">Oldest First</option>
                      <option value="mood">By Mood</option>
                    </select>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-primary hover:text-primary-hover flex items-center gap-1"
                    >
                      <X size={14} />
                      Clear filters
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {stats.total > 0 && (
        <motion.div
          className="grid grid-cols-3 gap-4 mb-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={staggerItem}>
            <Card>
              <CardContent className="text-center py-4">
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted">Total Entries</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={staggerItem}>
            <Card>
              <CardContent className="text-center py-4">
                <p className="text-2xl font-bold text-foreground">{stats.thisMonth}</p>
                <p className="text-sm text-muted">This Month</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={staggerItem}>
            <Card>
              <CardContent className="text-center py-4">
                <p className="text-2xl font-bold text-foreground">{stats.withPhotos}</p>
                <p className="text-sm text-muted">With Photos</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              illustration="journal"
              title={searchQuery || hasActiveFilters ? 'No matching entries' : 'No journal entries'}
              description={
                searchQuery || hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Capture your travel experiences with photos and stories'
              }
              action={
                searchQuery || hasActiveFilters ? (
                  <Button variant="ghost" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                ) : (
                  <Link to="/journal/new">
                    <Button leftIcon={<Plus size={18} />}>Write Your First Entry</Button>
                  </Link>
                )
              }
            />
          </CardContent>
        </Card>
      ) : (
        <motion.div className="space-y-4" variants={staggerContainer} initial="hidden" animate="visible">
          {filteredEntries.map((entry) => (
            <motion.div key={entry._id} variants={staggerItem}>
              <Link to="/journal/$entryId" params={{ entryId: entry._id }}>
                <Card hoverable>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="text-accent" size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-foreground text-lg">{entry.title || 'Untitled Entry'}</h3>
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
                          <p className="text-muted text-sm line-clamp-2 mb-3">{getContentPreview(entry.content)}...</p>
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
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatedPage>
  );
};

export const Route = createFileRoute('/_authenticated/journal/')({
  component: JournalPage,
});
