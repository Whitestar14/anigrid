import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface PopoverAction {
  label: string;
  icon: LucideIcon;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'default' | 'danger';
}

interface PopoverMenuProps {
  isOpen: boolean;
  onClose: () => void;
  actions: PopoverAction[];
  className?: string;
  align?: 'center' | 'top' | 'bottom';
}

export const PopoverMenu: React.FC<PopoverMenuProps> = ({
  isOpen,
  onClose,
  actions,
  className = "",
  align = 'center'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={`popover-menu absolute w-max min-w-[160px] left-1/2 -translate-x-1/2 glass-panel shadow-2xl rounded-2xl z-[100] flex flex-col p-1.5 ${
            align === 'top' ? 'bottom-full mb-2' : 
            align === 'bottom' ? 'top-full mt-2' : 
            'top-1/2 -translate-y-1/2'
          } ${className}`}
        >
          {actions.map((action, i) => (
            <React.Fragment key={action.label}>
              {i > 0 && <div className="h-[1px] bg-white/5 mx-2 my-0.5" />}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick(e);
                  onClose();
                }}
                className={`flex items-center justify-between p-2.5 hover:bg-white/10 rounded-xl text-[13px] font-semibold transition-all active:scale-95 ${
                  action.variant === 'danger' ? 'text-red-400 hover:bg-red-500/20' : 'text-white/90'
                }`}
              >
                <span>{action.label}</span>
                <action.icon size={16} className={action.variant === 'danger' ? 'text-red-400/50' : 'text-white/40'} />
              </button>
            </React.Fragment>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
