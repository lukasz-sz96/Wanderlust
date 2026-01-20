import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  illustration: 'places' | 'trips' | 'journal' | 'photos' | 'search';
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState = ({ illustration, title, description, action }: EmptyStateProps) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-6"
      >
        {illustration === 'places' && <PlacesIllustration />}
        {illustration === 'trips' && <TripsIllustration />}
        {illustration === 'journal' && <JournalIllustration />}
        {illustration === 'photos' && <PhotosIllustration />}
        {illustration === 'search' && <SearchIllustration />}
      </motion.div>
      <motion.h3
        className="text-lg font-semibold text-foreground mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {title}
      </motion.h3>
      <motion.p
        className="text-muted mb-6 max-w-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {description}
      </motion.p>
      {action && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          {action}
        </motion.div>
      )}
    </motion.div>
  );
};

const PlacesIllustration = () => (
  <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="80" cy="130" rx="60" ry="8" className="fill-border-light" />
    <motion.g
      initial={{ y: 5 }}
      animate={{ y: -5 }}
      transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2, ease: 'easeInOut' }}
    >
      <path
        d="M80 20C62 20 48 34 48 52C48 78 80 105 80 105C80 105 112 78 112 52C112 34 98 20 80 20Z"
        className="fill-primary"
        opacity="0.9"
      />
      <circle cx="80" cy="50" r="14" className="fill-surface" />
      <circle cx="80" cy="50" r="8" className="fill-primary-light" />
    </motion.g>
    <motion.path
      d="M30 90C30 90 45 85 55 90C65 95 75 88 80 90"
      className="stroke-secondary"
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray="4 4"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.5, delay: 0.5 }}
    />
    <motion.path
      d="M80 90C85 92 95 85 105 90C115 95 130 88 130 88"
      className="stroke-accent"
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray="4 4"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.5, delay: 0.8 }}
    />
    <motion.circle
      cx="30"
      cy="90"
      r="5"
      className="fill-secondary"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.3 }}
    />
    <motion.circle
      cx="130"
      cy="88"
      r="5"
      className="fill-accent"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1.2 }}
    />
  </svg>
);

const TripsIllustration = () => (
  <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="80" cy="130" rx="60" ry="8" className="fill-border-light" />
    <motion.g
      initial={{ rotate: -5 }}
      animate={{ rotate: 5 }}
      transition={{ repeat: Infinity, repeatType: 'reverse', duration: 3, ease: 'easeInOut' }}
    >
      <rect x="45" y="55" width="70" height="50" rx="8" className="fill-secondary" />
      <rect x="50" y="60" width="60" height="40" rx="4" className="fill-surface" opacity="0.3" />
      <rect x="55" y="45" width="50" height="12" rx="4" className="fill-secondary-dark" />
      <circle cx="60" cy="80" r="8" className="fill-surface" opacity="0.5" />
      <circle cx="80" cy="80" r="8" className="fill-surface" opacity="0.5" />
      <circle cx="100" cy="80" r="8" className="fill-surface" opacity="0.5" />
    </motion.g>
    <motion.g
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <path d="M25 70L15 85L35 85L25 70Z" className="fill-accent" />
      <rect x="22" y="85" width="6" height="20" className="fill-accent" />
    </motion.g>
    <motion.g initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }}>
      <path d="M135 65L120 90L150 90L135 65Z" className="fill-primary" />
      <path d="M135 75L125 90L145 90L135 75Z" className="fill-primary-light" />
    </motion.g>
    <motion.circle
      cx="140"
      cy="35"
      r="12"
      className="fill-warning"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: 'spring' }}
    />
  </svg>
);

const JournalIllustration = () => (
  <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="80" cy="130" rx="60" ry="8" className="fill-border-light" />
    <motion.g
      initial={{ rotate: -3 }}
      animate={{ rotate: 3 }}
      transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2.5, ease: 'easeInOut' }}
    >
      <rect x="40" y="25" width="80" height="95" rx="4" className="fill-accent" />
      <rect x="48" y="25" width="72" height="95" rx="2" className="fill-surface" />
      <rect x="44" y="35" width="4" height="75" className="fill-accent-dark" />
      <motion.g initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5, duration: 0.3 }}>
        <rect x="58" y="40" width="50" height="4" rx="2" className="fill-border-light" />
        <rect x="58" y="52" width="40" height="4" rx="2" className="fill-border-light" />
        <rect x="58" y="64" width="45" height="4" rx="2" className="fill-border-light" />
      </motion.g>
      <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: 'spring' }}>
        <rect x="58" y="80" width="30" height="25" rx="2" className="fill-secondary" opacity="0.3" />
        <circle cx="73" cy="92" r="6" className="fill-secondary" />
      </motion.g>
    </motion.g>
    <motion.path
      d="M125 45C125 45 130 35 140 40C150 45 145 55 140 60"
      className="stroke-primary"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
    />
    <motion.circle
      cx="140"
      cy="62"
      r="4"
      className="fill-primary"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1.3 }}
    />
  </svg>
);

const PhotosIllustration = () => (
  <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="80" cy="130" rx="60" ry="8" className="fill-border-light" />
    <motion.g initial={{ rotate: 8, x: 10 }} animate={{ rotate: 8, x: 10 }}>
      <rect x="50" y="35" width="70" height="55" rx="4" className="fill-border" />
      <rect x="54" y="39" width="62" height="47" rx="2" className="fill-surface" />
    </motion.g>
    <motion.g initial={{ rotate: -5 }} animate={{ rotate: -5 }}>
      <rect x="45" y="40" width="70" height="55" rx="4" className="fill-secondary" />
      <rect x="49" y="44" width="62" height="47" rx="2" className="fill-surface" />
      <motion.path
        d="M49 75L65 60L80 72L95 55L111 75V89C111 90.1 110.1 91 109 91H51C49.9 91 49 90.1 49 89V75Z"
        className="fill-secondary"
        opacity="0.3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.6 }}
      />
      <motion.circle
        cx="100"
        cy="56"
        r="6"
        className="fill-warning"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, type: 'spring' }}
      />
    </motion.g>
    <motion.g initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
      <rect x="35" y="50" width="70" height="55" rx="4" className="fill-primary" />
      <rect x="39" y="54" width="62" height="47" rx="2" className="fill-surface" />
      <motion.path
        d="M39 85L55 70L70 82L85 65L101 85V99C101 100.1 100.1 101 99 101H41C39.9 101 39 100.1 39 99V85Z"
        className="fill-primary"
        opacity="0.3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.8 }}
      />
      <motion.circle
        cx="90"
        cy="66"
        r="6"
        className="fill-warning"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
      />
    </motion.g>
  </svg>
);

const SearchIllustration = () => (
  <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="80" cy="130" rx="60" ry="8" className="fill-border-light" />
    <motion.g
      initial={{ scale: 0.9 }}
      animate={{ scale: 1.1 }}
      transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5, ease: 'easeInOut' }}
    >
      <circle cx="70" cy="60" r="35" className="stroke-primary" strokeWidth="6" fill="none" />
      <circle cx="70" cy="60" r="25" className="fill-primary" opacity="0.1" />
    </motion.g>
    <motion.line
      x1="95"
      y1="85"
      x2="125"
      y2="115"
      className="stroke-primary"
      strokeWidth="8"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    />
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, type: 'spring' }}
    >
      <circle cx="60" cy="55" r="4" className="fill-secondary" />
      <circle cx="75" cy="50" r="3" className="fill-accent" />
      <circle cx="80" cy="65" r="3" className="fill-warning" />
    </motion.g>
  </svg>
);

export default EmptyState;
