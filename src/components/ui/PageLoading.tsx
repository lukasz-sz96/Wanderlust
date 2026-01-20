import { motion } from 'framer-motion';
import { Spinner } from './Spinner';

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = 'Loading...' }: PageLoadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[400px] p-8"
    >
      <Spinner size="lg" className="mb-4" />
      <p className="text-muted">{message}</p>
    </motion.div>
  );
}

export function FullPageLoading({ message = 'Loading...' }: PageLoadingProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center"
      >
        <Spinner size="xl" className="mb-4" />
        <p className="text-muted">{message}</p>
      </motion.div>
    </div>
  );
}

export default PageLoading;
