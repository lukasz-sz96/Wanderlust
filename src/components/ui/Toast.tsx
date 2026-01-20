import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Array<Toast>;
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Array<Toast>>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const toast: Toast = { id, message, type, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  const success = useCallback(
    (message: string, duration?: number) => addToast(message, 'success', duration),
    [addToast],
  );
  const error = useCallback((message: string, duration?: number) => addToast(message, 'error', duration), [addToast]);
  const warning = useCallback(
    (message: string, duration?: number) => addToast(message, 'warning', duration),
    [addToast],
  );
  const info = useCallback((message: string, duration?: number) => addToast(message, 'info', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Array<Toast>;
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const icons = {
    success: <CheckCircle className="text-emerald-500" size={18} />,
    error: <XCircle className="text-red-500" size={18} />,
    warning: <AlertCircle className="text-amber-500" size={18} />,
    info: <Info className="text-blue-500" size={18} />,
  };

  const backgrounds = {
    success: 'bg-surface border-emerald-500/30',
    error: 'bg-surface border-red-500/30',
    warning: 'bg-surface border-amber-500/30',
    info: 'bg-surface border-blue-500/30',
  };

  const accents = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative flex items-center gap-3 p-3 pr-10 rounded-xl border shadow-lg overflow-hidden ${backgrounds[toast.type]}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accents[toast.type]}`} />
      <div className="flex-shrink-0 ml-1">{icons[toast.type]}</div>
      <p className="flex-1 text-sm font-medium text-foreground min-w-0">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export default ToastProvider;
