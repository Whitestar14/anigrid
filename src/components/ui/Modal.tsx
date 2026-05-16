import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/store/useStore';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className, contentClassName }) => {
  const reduceGlass = useStore((s) => s.preferences.reduceGlassEffects ?? false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`absolute inset-0 ${reduceGlass ? 'bg-black/90' : 'bg-black/60 backdrop-blur-sm'}`}
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={cn(
              "relative w-full shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[85vh] glass-panel",
              className
            )}
          >
            {title && (
              <div className="flex items-center justify-between px-8 py-6 border-b border-border shrink-0">
                <h2 className="text-xl font-medium text-text tracking-tight">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 rounded-full bg-surface-secondary hover:bg-hover text-muted hover:text-text transition-colors border border-border"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className={cn("p-8 overflow-y-auto custom-scrollbar", contentClassName)}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
