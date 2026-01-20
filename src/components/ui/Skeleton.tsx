import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export const Skeleton = ({ className = '', animate = true }: SkeletonProps) => {
  const baseClass = `bg-border-light rounded ${animate ? 'animate-pulse' : ''}`;
  return <div className={`${baseClass} ${className}`} />;
};

export const SkeletonText = ({ lines = 3, className = '' }: { lines?: number; className?: string }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4" style={{ width: i === lines - 1 ? '60%' : '100%' } as React.CSSProperties} />
      ))}
    </div>
  );
};

export const SkeletonAvatar = ({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };
  return <Skeleton className={`${sizes[size]} rounded-full ${className}`} />;
};

export const SkeletonCard = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`bg-surface border border-border-light rounded-xl p-4 ${className}`}>
      <div className="flex items-start gap-3 mb-4">
        <SkeletonAvatar size="lg" />
        <div className="flex-1">
          <Skeleton className="h-5 w-1/2 mb-2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
};

export const SkeletonPlaceCard = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`bg-surface border border-border-light rounded-xl overflow-hidden ${className}`}>
      <Skeleton className="h-40 rounded-none" />
      <div className="p-4">
        <Skeleton className="h-5 w-2/3 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mt-2" />
        <div className="mt-3 pt-3 border-t border-border-light">
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonTripCard = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`bg-surface border border-border-light rounded-xl overflow-hidden ${className}`}>
      <Skeleton className="h-40 rounded-none" />
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-1/3 mb-2" />
        <Skeleton className="h-4 w-1/4 mb-3" />
        <Skeleton className="h-4 w-full" />
        <div className="mt-3 pt-3 border-t border-border-light flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonJournalEntry = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`bg-surface border border-border-light rounded-xl p-4 ${className}`}>
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-1/4 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonListItem = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`bg-surface border border-border-light rounded-xl p-3 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-5 h-5" />
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-5 w-1/2 mb-1" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
};

export const SkeletonStats = ({ count = 4 }: { count?: number }) => {
  return (
    <div className={`grid grid-cols-${Math.min(count, 4)} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface border border-border-light rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div>
              <Skeleton className="h-7 w-12 mb-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonMap = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`bg-border-light rounded-xl ${className}`}>
      <div className="h-full flex items-center justify-center">
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    </div>
  );
};

export default Skeleton;
