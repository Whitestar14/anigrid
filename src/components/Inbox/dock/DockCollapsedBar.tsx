import React, { useRef } from "react";
import { motion } from "motion/react";
import { PixelIcon } from "@/components/pixel/PixelIcon";

const SWIPE_THRESHOLD = 14;

interface DockCollapsedBarProps {
  /** The bar is inert while the dock is open. */
  inert: boolean;
  isDraggingItem?: boolean;
  /** Swiping the bar up reopens whichever surface was last showing. */
  onExpand: () => void;
  onOpenLibrary: () => void;
  onOpenSettings: () => void;
}

/**
 * The always-visible 48px bar. It is `inert` (leaving the tab order and the
 * accessibility tree) whenever an expanded surface is mounted.
 */
export const DockCollapsedBar: React.FC<DockCollapsedBarProps> = ({
  inert,
  isDraggingItem = false,
  onExpand,
  onOpenLibrary,
  onOpenSettings,
}) => {
  const swipeStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    swipeStartY.current = e.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const start = swipeStartY.current;
    if (start === null) return;
    const dy = (e.touches[0]?.clientY ?? start) - start;
    if (dy < -SWIPE_THRESHOLD) {
      swipeStartY.current = null;
      onExpand();
    }
  };

  return (
    <div
      inert={inert || undefined}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      style={{ touchAction: "none" }}
      className={`absolute left-0 right-0 top-0 flex items-stretch px-2 py-1.5 h-[3rem] gap-1 transition-opacity duration-200 ${
        inert
          ? "opacity-0 pointer-events-none"
          : "opacity-100 pointer-events-auto delay-75"
      }`}
    >
      {isDraggingItem ? (
        <div
          aria-live="polite"
          className="flex-1 flex items-center justify-center gap-2 text-muted"
        >
          <span className="text-subheadline font-medium">Moving item</span>
          <span aria-hidden className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="block w-1 h-1 rounded-full bg-current"
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "linear",
                }}
              />
            ))}
          </span>
        </div>
      ) : (
        <>
          <button
            type="button"
            aria-label="Open Library"
            className="flex-1 min-w-0 flex items-center justify-center gap-2 text-subheadline font-medium text-text hover:bg-hover transition-colors duration-150 rounded-control"
            onClick={onOpenLibrary}
          >
            <PixelIcon name="library" size={18} className="shrink-0" />
            <span className="truncate">Library</span>
          </button>
          <div className="w-px bg-border self-center h-5 shrink-0" />
          <button
            type="button"
            aria-label="Open Settings"
            className="w-10 flex items-center justify-center text-muted hover:text-text hover:bg-hover transition-colors duration-150 rounded-control shrink-0"
            onClick={onOpenSettings}
          >
            <PixelIcon name="settings" size={18} />
          </button>
        </>
      )}
    </div>
  );
};
