import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { useState } from 'react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { Card, CardContent, Button, Badge, IconButton, PageLoading } from '../../../components/ui';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  MapPin,
  Plane,
  Edit,
  Trash2,
  Star,
  Smile,
  Meh,
  Frown,
  Image,
  Upload,
  X,
  Loader2,
  Cloud,
} from 'lucide-react';
import { formatTemperature } from '../../../lib/api/weather';

export const Route = createFileRoute('/_authenticated/journal/$entryId')({
  component: JournalEntryPage,
});

const JournalEntryPage = () => {
  const { entryId } = Route.useParams();
  const entry = useQuery(api.journal.get, { entryId: entryId as Id<'journalEntries'> });
  const photos = useQuery(api.photos.listByJournalEntry, { journalEntryId: entryId as Id<'journalEntries'> });

  const deleteEntry = useMutation(api.journal.remove);
  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const createPhoto = useMutation(api.photos.create);
  const deletePhoto = useMutation(api.photos.remove);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (entry === undefined || photos === undefined) {
    return <PageLoading message="Loading entry..." />;
  }

  if (entry === null) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-border-light flex items-center justify-center mx-auto mb-4">
            <BookOpen className="text-muted" size={40} />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Entry not found</h2>
          <p className="text-muted mb-6">This entry may have been deleted or doesn't exist.</p>
          <Link to="/journal">
            <Button variant="primary">Back to Journal</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    await deleteEntry({ entryId: entry._id });
    window.location.href = '/journal';
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const { storageId } = await response.json();

      await createPhoto({
        storageId,
        journalEntryId: entry._id,
        tripId: entry.tripId,
        placeId: entry.placeId,
      });
    } catch (error) {
      console.error('Failed to upload photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: Id<'photos'>) => {
    await deletePhoto({ photoId });
    setSelectedPhoto(null);
  };

  const getMoodIcon = (mood?: string) => {
    switch (mood) {
      case 'amazing':
        return <Star className="text-warning" size={20} />;
      case 'good':
        return <Smile className="text-secondary" size={20} />;
      case 'neutral':
        return <Meh className="text-muted" size={20} />;
      case 'challenging':
        return <Frown className="text-primary" size={20} />;
      default:
        return null;
    }
  };

  const getMoodLabel = (mood?: string) => {
    switch (mood) {
      case 'amazing':
        return 'Feeling amazing';
      case 'good':
        return 'Feeling good';
      case 'neutral':
        return 'Feeling neutral';
      case 'challenging':
        return 'Challenging day';
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

  const getContentText = (content: unknown): string => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (typeof content === 'object' && content !== null) {
      const doc = content as { content?: Array<{ content?: Array<{ text?: string }> }> };
      if (doc.content) {
        return doc.content
          .flatMap((node) => node.content?.map((n) => n.text) || [])
          .filter(Boolean)
          .join('\n\n');
      }
    }
    return '';
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          to="/journal"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Journal
        </Link>
      </div>

      <Card>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">{entry.title || 'Untitled Entry'}</h1>
              <p className="text-muted flex items-center gap-2">
                <Calendar size={16} />
                {formatDate(entry.entryDate)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <IconButton variant="danger" size="sm" label="Delete entry" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 size={16} />
              </IconButton>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {entry.mood && (
              <div className="flex items-center gap-2">
                {getMoodIcon(entry.mood)}
                <span className="text-foreground">{getMoodLabel(entry.mood)}</span>
              </div>
            )}
            {entry.weatherSnapshot && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-info/10">
                <span className="text-xl">{entry.weatherSnapshot.icon}</span>
                <span className="font-medium text-foreground">
                  {formatTemperature(entry.weatherSnapshot.temperature)}
                </span>
                <span className="text-sm text-muted">{entry.weatherSnapshot.condition}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {entry.trip && (
              <Link to="/trips/$tripId" params={{ tripId: entry.trip._id }}>
                <Badge variant="primary" className="flex items-center gap-1 cursor-pointer hover:opacity-80">
                  <Plane size={12} />
                  {entry.trip.title}
                </Badge>
              </Link>
            )}
            {entry.place && (
              <Link to="/places/$placeId" params={{ placeId: entry.place._id }}>
                <Badge variant="default" className="flex items-center gap-1 cursor-pointer hover:opacity-80">
                  <MapPin size={12} />
                  {entry.place.name}
                </Badge>
              </Link>
            )}
          </div>

          <div className="prose prose-slate max-w-none">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">{getContentText(entry.content)}</p>
          </div>

          <div className="border-t border-border-light pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Image size={20} />
                Photos ({photos.length})
              </h2>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  disabled={isUploading}
                  className="pointer-events-none"
                >
                  {isUploading ? 'Uploading...' : 'Add Photo'}
                </Button>
              </label>
            </div>

            {photos.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-border-light rounded-xl">
                <Image className="text-muted mx-auto mb-2" size={32} />
                <p className="text-muted text-sm">No photos yet</p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <Button variant="ghost" size="sm" className="mt-2 pointer-events-none">
                    Upload your first photo
                  </Button>
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo) => (
                  <div
                    key={photo._id}
                    className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group"
                    onClick={() => setSelectedPhoto(photo.url)}
                  >
                    <img src={photo.url} alt={photo.caption || 'Photo'} className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photo._id);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setSelectedPhoto(null)}
          >
            <X size={24} />
          </button>
          <img
            src={selectedPhoto}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
          <Card className="relative z-10 w-full max-w-md">
            <CardContent className="text-center">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-error" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Delete Entry?</h3>
              <p className="text-muted mb-6">This will permanently delete this journal entry and all its photos.</p>
              <div className="flex gap-3 justify-center">
                <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
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
