import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';

interface ProBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function ProBadge({ size = 'sm', className = '' }: ProBadgeProps) {
  const sizeStyles = {
    sm: {
      badge: 'px-1.5 py-0.5 gap-0.5',
      text: 'text-[10px]',
      icon: 10,
    },
    md: {
      badge: 'px-2.5 py-1 gap-1',
      text: 'text-xs',
      icon: 12,
    },
  };

  const styles = sizeStyles[size];

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`
        inline-flex items-center font-bold tracking-wide
        rounded-full select-none
        bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100
        text-amber-700 border border-amber-200/60
        shadow-sm shadow-amber-100/50
        ${styles.badge}
        ${styles.text}
        ${className}
      `}
      style={{
        backgroundSize: '200% 100%',
      }}
    >
      <Crown size={styles.icon} className="text-amber-600" strokeWidth={2.5} />
      <span className="uppercase">Pro</span>
    </motion.span>
  );
}

export default ProBadge;
