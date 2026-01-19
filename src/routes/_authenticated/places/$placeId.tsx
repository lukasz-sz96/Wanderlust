import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { MapView } from '../../../components/maps';
import {
  Card,
  CardContent,
  Button,
  Badge,
  IconButton,
  PageLoading,
} from '../../../components/ui';
import {
  ArrowLeft,
  MapPin,
  Heart,
  Star,
  Edit,
  Trash2,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/_authenticated/places/$placeId')({
  component: PlaceDetailPage,
});

const PlaceDetailPage = () => {
  const { placeId } = Route.useParams();
  const place = useQuery(api.places.get, { placeId: placeId as Id<'places'> });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deletePlace = useMutation(api.places.remove);

  if (place === undefined) {
    return <PageLoading message="Loading place..." />;
  }

  if (place === null) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-border-light flex items-center justify-center mx-auto mb-4">
            <MapPin className="text-muted" size={40} />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Place not found
          </h2>
          <p className="text-muted mb-6">
            This place may have been deleted or doesn't exist.
          </p>
          <Link to="/places">
            <Button variant="primary">Back to Places</Button>
          </Link>
        </div>
      </div>
    );
  }

  const location = [place.city, place.country].filter(Boolean).join(', ');

  const handleDelete = async () => {
    await deletePlace({ placeId: place._id });
    window.location.href = '/places';
  };

  const openInMaps = () => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`,
      '_blank'
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          to="/places"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Places
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card padding="none" className="overflow-hidden">
            <div className="h-64 lg:h-80">
              <MapView
                latitude={place.latitude}
                longitude={place.longitude}
                zoom={14}
                markers={[
                  {
                    id: place._id,
                    latitude: place.latitude,
                    longitude: place.longitude,
                    label: place.name,
                  },
                ]}
                className="h-full"
              />
            </div>
          </Card>

          {place.description && (
            <Card>
              <CardContent>
                <h3 className="font-semibold text-foreground mb-2">About</h3>
                <p className="text-muted">{place.description}</p>
              </CardContent>
            </Card>
          )}

          {place.aiDescription && (
            <Card>
              <CardContent>
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-secondary flex items-center justify-center text-white text-xs">
                    AI
                  </span>
                  AI Description
                </h3>
                <p className="text-muted">{place.aiDescription}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-foreground">
                    {place.name}
                  </h1>
                  <IconButton variant="ghost" size="sm" label="Add to bucket list">
                    <Heart size={20} />
                  </IconButton>
                </div>

                {place.category && (
                  <Badge variant="primary" className="mb-3">
                    {place.category}
                  </Badge>
                )}

                {location && (
                  <p className="text-muted flex items-center gap-2">
                    <MapPin size={16} />
                    {location}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  leftIcon={<Navigation size={16} />}
                  onClick={openInMaps}
                  className="flex-1"
                >
                  Directions
                </Button>
              </div>

              <div className="pt-4 border-t border-border-light flex gap-2">
                <IconButton variant="ghost" size="sm" label="Edit place">
                  <Edit size={16} />
                </IconButton>
                <IconButton
                  variant="danger"
                  size="sm"
                  label="Delete place"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 size={16} />
                </IconButton>
              </div>
            </CardContent>
          </Card>

          {place.tags && place.tags.length > 0 && (
            <Card>
              <CardContent>
                <h3 className="font-semibold text-foreground mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {place.tags.map((tag) => (
                    <Badge key={tag} variant="default">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent>
              <h3 className="font-semibold text-foreground mb-3">Coordinates</h3>
              <p className="text-sm text-muted font-mono">
                {place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <Card className="relative z-10 w-full max-w-md">
            <CardContent className="text-center">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-error" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Delete Place?
              </h3>
              <p className="text-muted mb-6">
                This will permanently delete "{place.name}" and remove it from
                your bucket list.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
