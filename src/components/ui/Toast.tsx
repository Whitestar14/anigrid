import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Info, AlertCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';

export type ToastType = 'success' | 'info' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  actionLabel?: string;
  action?: () => void;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed inset-x-0 top-16 z-toast flex flex-col items-center gap-2 px-4 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const Toast: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const reduceGlass = useStore((s) => s.preferences.reduceGlassEffects ?? false);

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = {
    success: <div className="bg-accent-green rounded-full p-0.5"><Check size={14} className="text-white" strokeWidth={3} /></div>,
    error: <div className="bg-destructive rounded-full p-0.5"><AlertCircle size={14} className="text-white" strokeWidth={3} /></div>,
    info: <div className="bg-primary rounded-full p-0.5"><Info size={14} className="text-on-accent" strokeWidth={3} /></div>,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`pointer-events-auto flex w-full max-w-md items-center gap-3 px-4 py-3 rounded-card ${reduceGlass
        ? 'bg-surface-elevated border border-border'
        : 'material-thick squircle'
        }`}
    >
      {icons[toast.type]}
      {/* `flex-1` so the message owns the free width and the optional action
          sits at the trailing edge instead of floating after the text. */}
      <span className="flex-1 min-w-0 text-subheadline font-medium text-text">
        {toast.message}
      </span>
      {toast.action && toast.actionLabel && (
        <button
          onClick={() => {
            toast.action!();
            onRemove(toast.id);
          }}
          className="ml-2 text-footnote font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          {toast.actionLabel}
        </button>
      )}
    </motion.div>
  );
};
