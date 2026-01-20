import { useState, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { Button } from '../ui';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface PhotoUploadProps {
  journalEntryId?: Id<'journalEntries'>;
  tripId?: Id<'trips'>;
  placeId?: Id<'places'>;
  onUploadComplete?: (photoId: Id<'photos'>) => void;
  maxFiles?: number;
  className?: string;
}

interface UploadingFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  error?: string;
}

export const PhotoUpload = ({
  journalEntryId,
  tripId,
  placeId,
  onUploadComplete,
  maxFiles = 10,
  className = '',
}: PhotoUploadProps) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const createPhoto = useMutation(api.photos.create);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, maxFiles - uploadingFiles.length);

    if (validFiles.length === 0) return;

    const newUploadingFiles: UploadingFile[] = validFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    for (const uploadFile of newUploadingFiles) {
      try {
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 10 } : f)),
        );

        const uploadUrl = await generateUploadUrl();

        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 30 } : f)),
        );

        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': uploadFile.file.type },
          body: uploadFile.file,
        });

        if (!result.ok) {
          throw new Error('Upload failed');
        }

        const { storageId } = await result.json();

        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 70 } : f)),
        );

        const img = new window.Image();
        img.src = uploadFile.preview;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const photoId = await createPhoto({
          storageId,
          journalEntryId,
          tripId,
          placeId,
          width: img.width,
          height: img.height,
        });

        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 100 } : f)),
        );

        onUploadComplete?.(photoId);

        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadFile.id));
          URL.revokeObjectURL(uploadFile.preview);
        }, 1000);
      } catch (error) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, error: 'Upload failed', progress: 0 } : f,
          ),
        );
      }
    }
  };

  const removeUploadingFile = (id: string) => {
    setUploadingFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
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

  return (
    <div className={className}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
          ${
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-border-light hover:border-primary/50 hover:bg-border-light/50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Upload className="text-primary" size={24} />
        </div>
        <p className="text-foreground font-medium mb-1">Drop photos here or click to upload</p>
        <p className="text-sm text-muted">Supports JPG, PNG, GIF up to 10MB each</p>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {uploadingFiles.map((file) => (
            <div key={file.id} className="relative group rounded-lg overflow-hidden aspect-square">
              <img src={file.preview} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                {file.error ? (
                  <div className="text-center">
                    <p className="text-white text-sm">{file.error}</p>
                    <button
                      onClick={() => removeUploadingFile(file.id)}
                      className="mt-2 text-white/80 hover:text-white text-sm underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : file.progress < 100 ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="text-white animate-spin mb-2" size={24} />
                    <span className="text-white text-sm">{file.progress}%</span>
                  </div>
                ) : (
                  <div className="text-white text-sm">Done!</div>
                )}
              </div>
              {file.error && (
                <button
                  onClick={() => removeUploadingFile(file.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
