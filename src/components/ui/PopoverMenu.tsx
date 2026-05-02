import React from 'react';
import { createPortal } from 'react-dom';
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
  triggerPoint?: { x: number; y: number } | null;
}

export const PopoverMenu: React.FC<PopoverMenuProps> = ({
  isOpen,
  onClose,
  actions,
  className = "",
  align = 'center',
  triggerPoint = null
}) => {
  const isFixed = !!triggerPoint;
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [coords, setCoords] = React.useState<{ x: number; y: number; translateY: number } | null>(null);

  // Measure and adjust position once mounted
  React.useEffect(() => {
    if (isOpen && triggerPoint && menuRef.current) {
      // Use a small delay to ensure the browser has layouted the element
      const timeout = setTimeout(() => {
        if (!menuRef.current) return;
        
        const rect = menuRef.current.getBoundingClientRect();
        const padding = 16;
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        let x = triggerPoint.x;
        let y = triggerPoint.y;
        let translateY = -100; // Default: show above cursor

        // Horizontal Constraint
        const halfW = rect.width / 2;
        if (x - halfW < padding) {
          x = halfW + padding;
        } else if (x + halfW > winW - padding) {
          x = winW - halfW - padding;
        }

        // Vertical Constraint
        // distanceToTop = triggerPoint.y
        if (y - rect.height - 40 < padding) {
          // If too close to top, show below cursor
          y = triggerPoint.y + 20;
          translateY = 0;
        } else {
          // Normal: show above cursor
          y = triggerPoint.y - 10;
          translateY = -100;
        }

        setCoords({ x, y, translateY });
      }, 0);
      
      return () => clearTimeout(timeout);
    } else if (!isOpen) {
      setCoords(null);
    }
  }, [isOpen, triggerPoint]);

  const style: React.CSSProperties = isFixed ? {
    position: 'fixed',
    left: coords?.x ?? triggerPoint?.x,
    top: coords?.y ?? triggerPoint?.y,
    transform: `translate(-50%, ${coords?.translateY ?? -50}%)`,
    opacity: coords ? 1 : 0,
    pointerEvents: coords ? 'auto' : 'none',
    zIndex: 150,
  } : {};

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: coords ? 1 : 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.12 }}
          style={style}
          data-position-mode="portal"
          className={`popover-menu w-max min-w-[160px] glass-panel shadow-2xl rounded-2xl flex flex-col p-1.5 ${
            isFixed ? '' : 'absolute left-1/2 -translate-x-1/2 ' + (
              align === 'top' ? 'bottom-full mb-2' : 
              align === 'bottom' ? 'top-full mt-2' : 
              'top-1/2 -translate-y-1/2'
            )
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

  if (isFixed) {
    return createPortal(content, document.body);
  }

  return content;
};
