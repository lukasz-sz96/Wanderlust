import { useState, useRef, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  X,
  Upload,
  Loader2,
  Globe,
  Users,
  Lock,
  Camera,
  ImagePlus,
  Check,
} from 'lucide-react';

interface PhotoUploadModalProps {
  placeId: Id<'places'>;
  placeName: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
}

type Visibility = 'public' | 'followers' | 'private';

interface PendingPhoto {
  id: string;
  file: File;
  preview: string;
  caption: string;
}

interface UploadProgress {
  id: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

const visibilityOptions: { value: Visibility; label: string; description: string; icon: typeof Globe }[] = [
  {
    value: 'public',
    label: 'Public',
    description: 'Everyone can see',
    icon: Globe,
  },
  {
    value: 'followers',
    label: 'Followers',
    description: 'Only followers',
    icon: Users,
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Only you',
    icon: Lock,
  },
];

export const PhotoUploadModal = ({
  placeId,
  placeName,
  isOpen,
  onClose,
  onUploadComplete,
}: PhotoUploadModalProps) => {
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const createPhoto = useMutation(api.photos.create);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, 20 - pendingPhotos.length);

    if (validFiles.length === 0) return;

    const newPhotos: PendingPhoto[] = validFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
      caption: '',
    }));

    setPendingPhotos((prev) => [...prev, ...newPhotos]);
  }, [pendingPhotos.length]);

  const removePhoto = (id: string) => {
    setPendingPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const updateCaption = (id: string, caption: string) => {
    setPendingPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, caption } : p))
    );
  };

  const handleUpload = async () => {
    if (pendingPhotos.length === 0 || isUploading) return;

    setIsUploading(true);
    setUploadProgress(
      pendingPhotos.map((p) => ({ id: p.id, progress: 0, status: 'uploading' as const }))
    );

    for (const photo of pendingPhotos) {
      try {
        setUploadProgress((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, progress: 20 } : p))
        );

        const uploadUrl = await generateUploadUrl();

        setUploadProgress((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, progress: 40 } : p))
        );

        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': photo.file.type },
          body: photo.file,
        });

        if (!result.ok) throw new Error('Upload failed');

        const { storageId } = await result.json();

        setUploadProgress((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, progress: 70 } : p))
        );

        const img = new window.Image();
        img.src = photo.preview;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        await createPhoto({
          storageId,
          placeId,
          width: img.width,
          height: img.height,
          caption: photo.caption || undefined,
          visibility,
        });

        setUploadProgress((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, progress: 100, status: 'done' as const } : p))
        );
      } catch (error) {
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.id === photo.id
              ? { ...p, status: 'error' as const, error: 'Failed to upload' }
              : p
          )
        );
      }
    }

    setTimeout(() => {
      pendingPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
      setPendingPhotos([]);
      setUploadProgress([]);
      setIsUploading(false);
      onUploadComplete?.();
      onClose();
    }, 1000);
  };

  const handleClose = () => {
    if (isUploading) return;
    pendingPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
    setPendingPhotos([]);
    setUploadProgress([]);
    onClose();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const getProgressForPhoto = (id: string) => {
    return uploadProgress.find((p) => p.id === id);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-surface rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="relative bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 p-6 border-b border-border-light">
              <button
                onClick={handleClose}
                disabled={isUploading}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface/80 flex items-center justify-center text-muted hover:text-foreground hover:bg-surface transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Camera className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Add Photos</h2>
                  <p className="text-sm text-muted truncate max-w-[280px]">{placeName}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {pendingPhotos.length === 0 ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-primary bg-primary/5 scale-[1.02]'
                      : 'border-border-light hover:border-primary/50 hover:bg-surface-hover'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <motion.div
                    animate={isDragOver ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-4"
                  >
                    <ImagePlus className="text-primary" size={32} />
                  </motion.div>
                  <p className="text-foreground font-medium mb-1">
                    Drop photos here or click to select
                  </p>
                  <p className="text-sm text-muted">JPG, PNG, HEIC up to 20 photos</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {pendingPhotos.map((photo) => {
                      const progress = getProgressForPhoto(photo.id);
                      return (
                        <div key={photo.id} className="relative group">
                          <div className="aspect-square rounded-xl overflow-hidden bg-surface-hover">
                            <img
                              src={photo.preview}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            {progress && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                {progress.status === 'uploading' ? (
                                  <div className="flex flex-col items-center">
                                    <Loader2 className="text-white animate-spin" size={24} />
                                    <span className="text-white text-xs mt-1">
                                      {progress.progress}%
                                    </span>
                                  </div>
                                ) : progress.status === 'done' ? (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
                                  >
                                    <Check className="text-white" size={20} />
                                  </motion.div>
                                ) : (
                                  <span className="text-error text-xs">{progress.error}</span>
                                )}
                              </div>
                            )}
                          </div>
                          {!progress && (
                            <button
                              onClick={() => removePhoto(photo.id)}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-error text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {!isUploading && pendingPhotos.length < 20 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-border-light hover:border-primary/50 hover:bg-surface-hover flex items-center justify-center transition-colors"
                      >
                        <ImagePlus className="text-muted" size={24} />
                      </button>
                    )}
                  </div>

                  {pendingPhotos.length === 1 && !isUploading && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Caption (optional)
                      </label>
                      <textarea
                        value={pendingPhotos[0].caption}
                        onChange={(e) => updateCaption(pendingPhotos[0].id, e.target.value)}
                        placeholder="Add a caption to your photo..."
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl border border-border-light bg-surface
                                 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
                                 resize-none text-foreground placeholder:text-muted"
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Who can see {pendingPhotos.length > 1 ? 'these photos' : 'this photo'}?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {visibilityOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = visibility === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => !isUploading && setVisibility(option.value)}
                        disabled={isUploading}
                        className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border-light hover:border-border'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <Icon
                          size={20}
                          className={isSelected ? 'text-primary' : 'text-muted'}
                        />
                        <p
                          className={`text-sm font-medium mt-2 ${
                            isSelected ? 'text-primary' : 'text-foreground'
                          }`}
                        >
                          {option.label}
                        </p>
                        <p className="text-xs text-muted mt-0.5">{option.description}</p>
                        {isSelected && (
                          <motion.div
                            layoutId="visibility-check"
                            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                          >
                            <Check size={12} className="text-white" />
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border-light bg-surface">
              <button
                onClick={handleUpload}
                disabled={pendingPhotos.length === 0 || isUploading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-hover
                         text-white font-medium transition-all
                         hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02]
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none
                         flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload {pendingPhotos.length > 0 ? `${pendingPhotos.length} Photo${pendingPhotos.length > 1 ? 's' : ''}` : 'Photos'}
                  </>
                )}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PhotoUploadModal;
