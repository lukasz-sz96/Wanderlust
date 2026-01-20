import { motion } from 'framer-motion';
import { MapPin, Globe } from 'lucide-react';

type MapMode = 'my-places' | 'discover';

interface MapDiscoverToggleProps {
  mode: MapMode;
  onChange: (mode: MapMode) => void;
  className?: string;
}

export const MapDiscoverToggle = ({ mode, onChange, className = '' }: MapDiscoverToggleProps) => {
  return (
    <div
      className={`inline-flex items-center p-1 rounded-full bg-surface/95 backdrop-blur-sm border border-border-light shadow-lg ${className}`}
    >
      <button
        onClick={() => onChange('my-places')}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          mode === 'my-places' ? 'text-white' : 'text-muted hover:text-foreground'
        }`}
      >
        {mode === 'my-places' && (
          <motion.div
            layoutId="map-toggle-bg"
            className="absolute inset-0 bg-gradient-to-r from-primary to-primary-hover rounded-full"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
          />
        )}
        <MapPin size={14} className="relative z-10" />
        <span className="relative z-10">My Places</span>
      </button>

      <button
        onClick={() => onChange('discover')}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          mode === 'discover' ? 'text-white' : 'text-muted hover:text-foreground'
        }`}
      >
        {mode === 'discover' && (
          <motion.div
            layoutId="map-toggle-bg"
            className="absolute inset-0 bg-gradient-to-r from-secondary to-accent rounded-full"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
          />
        )}
        <Globe size={14} className="relative z-10" />
        <span className="relative z-10">Discover</span>
      </button>
    </div>
  );
};

export default MapDiscoverToggle;
