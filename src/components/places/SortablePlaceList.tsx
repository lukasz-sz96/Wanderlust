import { useState } from 'react';
import {
  DndContext,
  
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from '@tanstack/react-router';
import { Cloud, GripVertical, MapPin, Star } from 'lucide-react';
import { Badge, Card } from '../ui';
import { formatTemperature } from '../../lib/api/weather';
import type {DragEndEvent} from '@dnd-kit/core';
import type { Id } from '../../../convex/_generated/dataModel';

interface BucketListItem {
  _id: Id<'bucketListItems'>;
  status: 'want_to_visit' | 'visited' | 'skipped';
  priority: number;
  rating?: number;
  visitedDate?: string;
  weatherSnapshot?: {
    temperature: number;
    condition: string;
    icon: string;
  };
  place: {
    _id: Id<'places'>;
    name: string;
    category?: string;
    city?: string;
    country?: string;
  } | null;
}

interface SortablePlaceListProps {
  items: Array<BucketListItem>;
  onReorder: (itemIds: Array<Id<'bucketListItems'>>) => void;
}

export const SortablePlaceList = ({ items, onReorder }: SortablePlaceListProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item._id === active.id);
      const newIndex = items.findIndex((item) => item._id === over.id);

      const newOrder = arrayMove(items, oldIndex, newIndex);
      onReorder(newOrder.map((item) => item._id));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event) => setActiveId(event.active.id as string)}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item) => (
            <SortablePlaceItem key={item._id} item={item} isDragging={activeId === item._id} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

const SortablePlaceItem = ({ item, isDragging }: { item: BucketListItem; isDragging: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!item.place) return null;

  const location = [item.place.city, item.place.country].filter(Boolean).join(', ');

  return (
    <div ref={setNodeRef} style={style} className={`${isDragging ? 'z-50 relative' : ''}`}>
      <Card
        className={`
          transition-shadow duration-200
          ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}
        `}
      >
        <div className="flex items-center gap-3 p-3">
          <button
            {...attributes}
            {...listeners}
            className="touch-none p-1 text-muted hover:text-foreground cursor-grab active:cursor-grabbing"
          >
            <GripVertical size={20} />
          </button>

          <Link to="/places/$placeId" params={{ placeId: item.place._id }} className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary-light/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="text-primary" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate hover:text-primary transition-colors">
                  {item.place.name}
                </h4>
                {location && <p className="text-sm text-muted truncate">{location}</p>}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2 flex-shrink-0">
            {item.place.category && (
              <Badge variant="default" className="hidden sm:inline-flex">
                {item.place.category}
              </Badge>
            )}
            {item.status === 'visited' && item.weatherSnapshot && (
              <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-full bg-info/10 text-sm">
                <span>{item.weatherSnapshot.icon}</span>
                <span className="font-medium text-foreground">
                  {formatTemperature(item.weatherSnapshot.temperature)}
                </span>
              </div>
            )}
            {item.status === 'visited' && item.rating && (
              <div className="flex items-center gap-1 text-warning">
                <Star size={14} className="fill-current" />
                <span className="text-sm font-medium">{item.rating}</span>
              </div>
            )}
            <Badge
              variant={item.status === 'visited' ? 'success' : item.status === 'want_to_visit' ? 'primary' : 'default'}
              className="hidden sm:inline-flex"
            >
              {item.status === 'visited' ? 'Visited' : item.status === 'want_to_visit' ? 'Want to visit' : 'Skipped'}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SortablePlaceList;
