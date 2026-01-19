import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button, Card, Input, Textarea } from '../ui';
import { X, Plane, Loader2 } from 'lucide-react';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTripModal = ({ isOpen, onClose }: CreateTripModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [destinationName, setDestinationName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTrip = useMutation(api.trips.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const tripId = await createTrip({
        title: title.trim(),
        description: description.trim() || undefined,
        destination: destinationName.trim()
          ? {
              name: destinationName.trim(),
              latitude: 0,
              longitude: 0,
            }
          : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      handleClose();
      window.location.href = `/trips/${tripId}`;
    } catch (error) {
      console.error('Failed to create trip:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setDestinationName('');
    setStartDate('');
    setEndDate('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <Card className="relative z-10 w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between p-4 border-b border-border-light">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Plane className="text-secondary" size={20} />
              </div>
              <h2 className="text-xl font-semibold text-foreground">New Trip</h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-border-light transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <Input
              label="Trip Name *"
              placeholder="e.g., Summer in Italy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />

            <Input
              label="Destination"
              placeholder="e.g., Rome, Italy"
              value={destinationName}
              onChange={(e) => setDestinationName(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>

            <Textarea
              label="Description"
              placeholder="What's this trip about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="p-4 border-t border-border-light flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!title.trim() || isSubmitting}>
              {isSubmitting ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
              Create Trip
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateTripModal;
