import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { PlaceCard, SortablePlaceList, AddPlaceModal } from '../../../components/places';
import { Button, Card, CardContent, AnimatedPage, SkeletonPlaceCard, EmptyState } from '../../../components/ui';
import { staggerContainer, staggerItem } from '../../../lib/animations';
import { MapPin, Plus, Heart, CheckCircle, List, Grid } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/places/')({
  component: PlacesPage,
});

type TabType = 'all' | 'want_to_visit' | 'visited';
type ViewMode = 'grid' | 'list';

const PlacesPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const reorderItems = useMutation(api.bucketList.reorder);

  const bucketListItems = useQuery(
    api.bucketList.list,
    activeTab === 'all' ? {} : { status: activeTab }
  );

  const stats = useQuery(api.bucketList.getStats);

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
                viewMode === 'grid'
                  ? 'bg-primary text-white'
                  : 'text-muted hover:text-foreground'
              }`}
              aria-label="Grid view"
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-white'
                  : 'text-muted hover:text-foreground'
              }`}
              aria-label="List view"
            >
              <List size={18} />
            </button>
          </div>
          <Button leftIcon={<Plus size={18} />} onClick={() => setShowAddModal(true)}>Add Place</Button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
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
                ${isActive
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

      {bucketListItems.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              illustration="places"
              title={
                activeTab === 'want_to_visit'
                  ? 'No places on your wishlist'
                  : activeTab === 'visited'
                    ? 'No visited places yet'
                    : 'No places yet'
              }
              description={
                activeTab === 'want_to_visit'
                  ? 'Add places you dream of visiting to your wishlist'
                  : activeTab === 'visited'
                    ? 'Mark places as visited to track your travels'
                    : 'Start building your bucket list by adding places you want to visit'
              }
              action={
                <Button leftIcon={<Plus size={18} />} onClick={() => setShowAddModal(true)}>
                  Add Your First Place
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <SortablePlaceList items={bucketListItems} onReorder={handleReorder} />
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {bucketListItems.map((item) =>
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
              ) : null
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {stats.visited > 0 && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox
            label="Total Places"
            value={stats.total}
            icon={<MapPin className="text-primary" size={20} />}
          />
          <StatBox
            label="Want to Visit"
            value={stats.wantToVisit}
            icon={<Heart className="text-primary" size={20} />}
          />
          <StatBox
            label="Visited"
            value={stats.visited}
            icon={<CheckCircle className="text-secondary" size={20} />}
          />
          <StatBox
            label="Countries"
            value={stats.countries}
            icon={<MapPin className="text-accent" size={20} />}
          />
        </div>
      )}

      <AddPlaceModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </AnimatedPage>
  );
};

const StatBox = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) => (
  <Card>
    <CardContent className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-border-light flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </CardContent>
  </Card>
);
