import { AnimatePresence, motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animations';

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedList = ({ children, className = '' }: AnimatedListProps) => {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className={className}>
      {children}
    </motion.div>
  );
};

interface AnimatedListItemProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedListItem = ({ children, className = '' }: AnimatedListItemProps) => {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
};

export default AnimatedList;
