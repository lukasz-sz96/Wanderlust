import { motion } from 'framer-motion';
import { Globe, MapPin } from 'lucide-react';

type MapMode = 'my-places' | 'discover';

interface MapDiscoverToggleProps {
  mode: MapMode;
  onChange: (mode: MapMode) => void;
  className?: string;
}

export const MapDiscoverToggle = ({ mode, onChange, className = '' }: MapDiscoverToggleProps) => {
  return (
    <div
      className={`inline-flex items-center h-10 p-1 rounded-xl bg-surface/95 backdrop-blur-sm border border-border-light shadow-lg ${className}`}
    >
      <button
        onClick={() => onChange('my-places')}
        className={`relative flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm font-medium transition-all ${
          mode === 'my-places' ? 'text-white' : 'text-muted hover:text-foreground'
        }`}
      >
        {mode === 'my-places' && (
          <motion.div
            layoutId="map-toggle-bg"
            className="absolute inset-0 bg-gradient-to-r from-primary to-primary-hover rounded-lg shadow-sm"
            transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
          />
        )}
        <MapPin size={14} className="relative z-10" />
        <span className="relative z-10 hidden sm:inline">My Places</span>
      </button>

      <button
        onClick={() => onChange('discover')}
        className={`relative flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm font-medium transition-all ${
          mode === 'discover' ? 'text-white' : 'text-muted hover:text-foreground'
        }`}
      >
        {mode === 'discover' && (
          <motion.div
            layoutId="map-toggle-bg"
            className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg shadow-sm"
            transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
          />
        )}
        <Globe size={14} className="relative z-10" />
        <span className="relative z-10 hidden sm:inline">Discover</span>
      </button>
    </div>
  );
};

export default MapDiscoverToggle;
