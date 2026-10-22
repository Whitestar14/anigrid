import React, { useRef } from "react";
import { Library, Settings2 } from "lucide-react";

const SWIPE_THRESHOLD = 14;

interface DockCollapsedBarProps {
  /** The bar is inert while the dock is open. */
  inert: boolean;
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
      <button
        type="button"
        aria-label="Open Library"
        className="flex-1 min-w-0 flex items-center justify-center gap-2 text-subheadline font-medium text-text hover:bg-hover transition-colors duration-150 rounded-control"
        onClick={onOpenLibrary}
      >
        <Library size={17} strokeWidth={2} className="shrink-0" />
        <span className="truncate">Library</span>
      </button>
      <div className="w-px bg-border self-center h-5 shrink-0" />
      <button
        type="button"
        aria-label="Open Settings"
        className="w-10 flex items-center justify-center text-muted hover:text-text hover:bg-hover transition-colors duration-150 rounded-control shrink-0"
        onClick={onOpenSettings}
      >
        <Settings2 size={18} strokeWidth={2} />
      </button>
    </div>
  );
};
