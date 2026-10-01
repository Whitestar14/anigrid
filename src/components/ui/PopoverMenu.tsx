import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { LucideIcon } from "lucide-react";

export interface PopoverAction {
  label: string;
  icon: LucideIcon;
  onClick: (e: React.MouseEvent) => void;
  variant?: "default" | "danger";
}

interface PopoverMenuProps {
  isOpen: boolean;
  onClose: () => void;
  actions: PopoverAction[];
  className?: string;
  align?: "center" | "top" | "bottom";
  triggerPoint?: { x: number; y: number } | null;
}

export const PopoverMenu: React.FC<PopoverMenuProps> = ({
  isOpen,
  onClose,
  actions,
  className = "",
  align = "center",
  triggerPoint = null,
}) => {
  const isFixed = !!triggerPoint;
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [coords, setCoords] = React.useState<{
    x: number;
    y: number;
    translateY: number;
  } | null>(null);

  React.useLayoutEffect(() => {
    if (isOpen && triggerPoint && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const padding = 12;
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      let x = triggerPoint.x;
      let y = triggerPoint.y;
      let translateY = -100; // Default: above the anchor

      const halfW = rect.width / 2;
      if (x - halfW < padding) x = halfW + padding;
      else if (x + halfW > winW - padding) x = winW - halfW - padding;

      const menuH = rect.height;
      const spaceAbove = triggerPoint.y;
      const spaceBelow = winH - triggerPoint.y;

      if (spaceAbove > menuH + 40) {
        y = triggerPoint.y - 12;
        translateY = -100;
      } else if (spaceBelow > menuH + 40) {
        y = triggerPoint.y + 12;
        translateY = 0;
      } else if (spaceAbove > spaceBelow) {
        y = Math.min(winH - padding, Math.max(menuH + padding, triggerPoint.y));
        translateY = -100;
      } else {
        y = Math.max(padding, Math.min(winH - menuH - padding, triggerPoint.y));
        translateY = 0;
      }

      setCoords({ x, y, translateY });
    } else if (!isOpen) {
      setCoords(null);
    }
  }, [isOpen, triggerPoint]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("touchstart", handleClickOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("touchstart", handleClickOutside, true);
    };
  }, [isOpen, onClose]);

  /* Centring uses the standalone `translate` property rather than `transform`:
     the motion `scale` animation below writes `transform`, which would clobber
     an inline `translate(-50%, …)` and leave the menu offset by half its width. */
  const style: React.CSSProperties = isFixed
    ? {
        position: "fixed",
        left: coords?.x ?? triggerPoint?.x,
        top: coords?.y ?? triggerPoint?.y,
        translate: `-50% ${coords?.translateY ?? -50}%`,
        opacity: coords ? 1 : 0,
        pointerEvents: coords ? "auto" : "none",
        zIndex: 150,
      }
    : {};

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          role="menu"
          initial={{ opacity: 0, scale: 0.9, y: 4 }}
          animate={{ opacity: coords ? 1 : 0, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 560, damping: 34, mass: 0.6 }}
          style={style}
          className={`popover-menu w-max min-w-[200px] material-thick squircle rounded-tile
            flex flex-col p-1 ${
              isFixed
                ? ""
                : "absolute left-1/2 -translate-x-1/2 " +
                  (align === "top"
                    ? "bottom-full mb-2"
                    : align === "bottom"
                      ? "top-full mt-2"
                      : "top-1/2 -translate-y-1/2")
            } ${className}`}
        >
          {actions.map((action, i) => (
            <React.Fragment key={action.label}>
              {i > 0 && (
                <div
                  className="h-[0.5px] mx-3 my-0.5"
                  style={{ backgroundColor: "var(--material-hairline)" }}
                />
              )}
              <button
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick(e);
                  onClose();
                }}
                className={`flex items-center justify-between gap-4 min-h-[44px] px-3.5 rounded-control
                  text-subheadline font-normal transition-colors duration-100
                  ${
                    action.variant === "danger"
                      ? "text-destructive hover:bg-destructive/12 active:bg-destructive/20"
                      : "text-text hover:bg-hover active:bg-hover"
                  }`}
              >
                <span className="truncate">{action.label}</span>
                <action.icon
                  size={17}
                  strokeWidth={1.8}
                  className={
                    action.variant === "danger" ? "text-destructive" : "text-muted"
                  }
                />
              </button>
            </React.Fragment>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isFixed) return createPortal(content, document.body);
  return content;
};
