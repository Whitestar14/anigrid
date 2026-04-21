import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Info, AlertCircle } from 'lucide-react';

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
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const Toast: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = {
    success: <div className="bg-green-500 rounded-full p-0.5"><Check size={14} className="text-white" strokeWidth={3} /></div>,
    error: <div className="bg-red-500 rounded-full p-0.5"><AlertCircle size={14} className="text-white" strokeWidth={3} /></div>,
    info: <div className="bg-primary rounded-full p-0.5"><Info size={14} className="text-white" strokeWidth={3} /></div>,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-[#2c2c2e]/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl max-w-[90vw] sm:max-w-md"
    >
      {icons[toast.type]}
      <span className="text-[14px] font-medium text-white">{toast.message}</span>
      {toast.action && toast.actionLabel && (
        <button
          onClick={() => {
            toast.action!();
            onRemove(toast.id);
          }}
          className="ml-2 text-[13px] font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          {toast.actionLabel}
        </button>
      )}
    </motion.div>
  );
};
