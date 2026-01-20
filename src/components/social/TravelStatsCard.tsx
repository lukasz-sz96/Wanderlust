import { motion } from 'framer-motion';
import { Globe, Plane, MapPin, BookOpen, LucideIcon } from 'lucide-react';

interface TravelStatsCardProps {
  stats: {
    countries: number;
    trips: number;
    places: number;
    journals: number;
  };
  animate?: boolean;
}

interface StatItem {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

export function TravelStatsCard({ stats, animate = true }: TravelStatsCardProps) {
  const statItems: StatItem[] = [
    {
      icon: Globe,
      label: 'Countries',
      value: stats.countries,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      icon: Plane,
      label: 'Trips',
      value: stats.trips,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      icon: MapPin,
      label: 'Places',
      value: stats.places,
      color: 'text-accent-hover',
      bgColor: 'bg-accent/20'
    },
    {
      icon: BookOpen,
      label: 'Journals',
      value: stats.journals,
      color: 'text-info',
      bgColor: 'bg-info/10'
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <motion.div
      variants={animate ? containerVariants : undefined}
      initial={animate ? 'hidden' : undefined}
      animate={animate ? 'visible' : undefined}
      className="grid grid-cols-2 sm:grid-cols-4 gap-4"
    >
      {statItems.map(({ icon: Icon, label, value, color, bgColor }) => (
        <motion.div
          key={label}
          variants={animate ? itemVariants : undefined}
          whileHover={{ scale: 1.02 }}
          className="relative text-center p-4 rounded-xl bg-surface border border-border-light
                     hover:border-border hover:shadow-md transition-all duration-200"
        >
          <div className={`
            w-12 h-12 rounded-full ${bgColor}
            flex items-center justify-center mx-auto mb-3
          `}>
            <Icon size={22} className={color} strokeWidth={1.75} />
          </div>
          <motion.p
            className="text-2xl font-bold text-foreground tabular-nums"
            initial={animate ? { opacity: 0, scale: 0.5 } : undefined}
            animate={animate ? { opacity: 1, scale: 1 } : undefined}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            {value.toLocaleString()}
          </motion.p>
          <p className="text-sm text-muted font-medium mt-0.5">{label}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}

export default TravelStatsCard;
