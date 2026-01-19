import { motion } from 'framer-motion';
import { fadeInUp } from '../../lib/animations';

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedPage = ({ children, className = '' }: AnimatedPageProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeInUp}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;
