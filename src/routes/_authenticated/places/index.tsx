import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { PlaceCard, SortablePlaceList, AddPlaceModal } from '../../../components/places';
import { Button, Card, CardContent, AnimatedPage, SkeletonPlaceCard, EmptyState, Input } from '../../../components/ui';
import { staggerContainer, staggerItem } from '../../../lib/animations';
import { MapPin, Plus, Heart, CheckCircle, List, Grid, Search, X, Filter, SortAsc } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/places/')({
  component: PlacesPage,
});

type TabType = 'all' | 'want_to_visit' | 'visited';
type ViewMode = 'grid' | 'list';
type SortBy = 'priority' | 'name' | 'country' | 'recent';

const PlacesPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortBy>('priority');
  const [showFilters, setShowFilters] = useState(false);
  const reorderItems = useMutation(api.bucketList.reorder);

  const bucketListItems = useQuery(api.bucketList.list, activeTab === 'all' ? {} : { status: activeTab });

  const stats = useQuery(api.bucketList.getStats);

  const { countries, categories } = useMemo(() => {
    if (!bucketListItems) return { countries: [], categories: [] };
    const countrySet = new Set<string>();
    const categorySet = new Set<string>();
    bucketListItems.forEach((item) => {
      if (item.place?.country) countrySet.add(item.place.country);
      if (item.place?.category) categorySet.add(item.place.category);
    });
    return {
      countries: Array.from(countrySet).sort(),
      categories: Array.from(categorySet).sort(),
    };
  }, [bucketListItems]);

  const filteredItems = useMemo(() => {
    if (!bucketListItems) return [];
    let items = [...bucketListItems];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.place?.name.toLowerCase().includes(query) ||
          item.place?.city?.toLowerCase().includes(query) ||
          item.place?.country?.toLowerCase().includes(query),
      );
    }

    if (selectedCountry) {
      items = items.filter((item) => item.place?.country === selectedCountry);
    }

    if (selectedCategory) {
      items = items.filter((item) => item.place?.category === selectedCategory);
    }

    switch (sortBy) {
      case 'name':
        items.sort((a, b) => (a.place?.name || '').localeCompare(b.place?.name || ''));
        break;
      case 'country':
        items.sort((a, b) => (a.place?.country || '').localeCompare(b.place?.country || ''));
        break;
      case 'recent':
        items.sort((a, b) => b.createdAt - a.createdAt);
        break;
      default:
        break;
    }

    return items;
  }, [bucketListItems, searchQuery, selectedCountry, selectedCategory, sortBy]);

  const hasActiveFilters = selectedCountry || selectedCategory || sortBy !== 'priority';

  const clearFilters = () => {
    setSelectedCountry('');
    setSelectedCategory('');
    setSortBy('priority');
    setSearchQuery('');
  };

  if (bucketListItems === undefined || stats === undefined) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Places</h1>
            <p className="text-muted">Your bucket list of places to visit</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonPlaceCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'all' as TabType, label: 'All', count: stats.total, icon: MapPin },
    { id: 'want_to_visit' as TabType, label: 'Want to Visit', count: stats.wantToVisit, icon: Heart },
    { id: 'visited' as TabType, label: 'Visited', count: stats.visited, icon: CheckCircle },
  ];

  const handleReorder = (itemIds: Id<'bucketListItems'>[]) => {
    reorderItems({ itemIds });
  };

  return (
    <AnimatedPage className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Places</h1>
          <p className="text-muted">Your bucket list of places to visit</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface border border-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted hover:text-foreground'
              }`}
              aria-label="Grid view"
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-primary text-white' : 'text-muted hover:text-foreground'
              }`}
              aria-label="List view"
            >
              <List size={18} />
            </button>
          </div>
          <Button leftIcon={<Plus size={18} />} onClick={() => setShowAddModal(true)}>
            Add Place
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
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
                  ${
                    isActive
                      ? 'bg-primary text-white'
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
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search places..."
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
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        </div>
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
                    <label className="text-sm text-muted whitespace-nowrap">Country:</label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option value="">All countries</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted whitespace-nowrap">Category:</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option value="">All categories</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <SortAsc size={16} className="text-muted" />
                    <label className="text-sm text-muted whitespace-nowrap">Sort:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortBy)}
                      className="px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option value="priority">Priority</option>
                      <option value="name">Name (A-Z)</option>
                      <option value="country">Country</option>
                      <option value="recent">Recently Added</option>
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

      {filteredItems.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              illustration="places"
              title={
                searchQuery || hasActiveFilters
                  ? 'No matching places'
                  : activeTab === 'want_to_visit'
                    ? 'No places on your wishlist'
                    : activeTab === 'visited'
                      ? 'No visited places yet'
                      : 'No places yet'
              }
              description={
                searchQuery || hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : activeTab === 'want_to_visit'
                    ? 'Add places you dream of visiting to your wishlist'
                    : activeTab === 'visited'
                      ? 'Mark places as visited to track your travels'
                      : 'Start building your bucket list by adding places you want to visit'
              }
              action={
                searchQuery || hasActiveFilters ? (
                  <Button variant="ghost" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                ) : (
                  <Button leftIcon={<Plus size={18} />} onClick={() => setShowAddModal(true)}>
                    Add Your First Place
                  </Button>
                )
              }
            />
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <SortablePlaceList items={filteredItems} onReorder={handleReorder} />
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) =>
              item.place ? (
                <motion.div key={item._id} variants={staggerItem} layout>
                  <PlaceCard
                    id={item.place._id}
                    name={item.place.name}
                    category={item.place.category}
                    city={item.place.city}
                    country={item.place.country}
                    latitude={item.place.latitude}
                    longitude={item.place.longitude}
                    description={item.place.description}
                    status={item.status}
                    rating={item.rating}
                  />
                </motion.div>
              ) : null,
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {stats.visited > 0 && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="Total Places" value={stats.total} icon={<MapPin className="text-primary" size={20} />} />
          <StatBox
            label="Want to Visit"
            value={stats.wantToVisit}
            icon={<Heart className="text-primary" size={20} />}
          />
          <StatBox label="Visited" value={stats.visited} icon={<CheckCircle className="text-secondary" size={20} />} />
          <StatBox label="Countries" value={stats.countries} icon={<MapPin className="text-accent" size={20} />} />
        </div>
      )}

      <AddPlaceModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </AnimatedPage>
  );
};

const StatBox = ({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) => (
  <Card>
    <CardContent className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-border-light flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </CardContent>
  </Card>
);
