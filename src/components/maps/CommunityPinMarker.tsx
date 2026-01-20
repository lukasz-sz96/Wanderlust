import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

interface Contributor {
  _id: Id<'users'>;
  displayName?: string;
  avatarUrl?: string;
}

interface CommunityPinMarkerProps {
  name: string;
  photoCount: number;
  previewUrl?: string;
  contributors: Array<Contributor>;
  isHovered?: boolean;
  onClick?: () => void;
}

export const CommunityPinMarker = ({
  name,
  photoCount,
  previewUrl,
  contributors,
  isHovered = false,
  onClick,
}: CommunityPinMarkerProps) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative cursor-pointer"
      title={name}
    >
      <div
        className={`relative w-10 h-10 rounded-full border-2 border-[#9C89B8] bg-surface/90 backdrop-blur-sm
                    flex items-center justify-center overflow-hidden shadow-md
                    transition-all duration-200 ${isHovered ? 'border-[#9C89B8] shadow-lg shadow-[#9C89B8]/30' : ''}`}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : contributors.length > 0 ? (
          <div className="flex items-center justify-center">
            {contributors.slice(0, 2).map((contributor, i) => (
              <div
                key={contributor._id}
                className={`w-5 h-5 rounded-full border-2 border-surface bg-border-light overflow-hidden ${
                  i > 0 ? '-ml-2' : ''
                }`}
              >
                {contributor.avatarUrl ? (
                  <img
                    src={contributor.avatarUrl}
                    alt={contributor.displayName || 'Contributor'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#9C89B8] to-[#7B6A9C] flex items-center justify-center">
                    <span className="text-[8px] font-semibold text-white">
                      {(contributor.displayName || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Camera size={16} className="text-[#9C89B8]" />
        )}

        <div className="absolute inset-0 rounded-full ring-2 ring-[#9C89B8]/30" />
      </div>

      {photoCount > 1 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full
                     bg-[#9C89B8] text-white text-[10px] font-semibold
                     flex items-center justify-center shadow-sm"
        >
          {photoCount > 99 ? '99+' : photoCount}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        className="absolute left-1/2 -translate-x-1/2 -bottom-8 whitespace-nowrap
                   bg-surface/95 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium
                   text-foreground shadow-lg border border-border-light pointer-events-none"
      >
        {name}
      </motion.div>
    </motion.div>
  );
};

export default CommunityPinMarker;
