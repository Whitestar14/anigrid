import React from "react";
import { ChevronDown } from "lucide-react";

/**
 * The header every dock surface shares.
 *
 * This replaces two near-identical components — one for the Library with a
 * segmented control, one for Settings with just a title. They had the same
 * height, the same divider and the same collapse affordance, and differed only
 * by whether anything sat between the title and the chevron, which is exactly
 * what `children` is for.
 */
export const DockHeader: React.FC<{
  title: string;
  onCollapse: () => void;
  /** Trailing controls, e.g. the Library's Stash/Search switch. */
  children?: React.ReactNode;
}> = ({ title, onCollapse, children }) => (
  <div
    className="h-12 flex items-center justify-between gap-3 pl-5 pr-1 sm:pr-2 select-none shrink-0 border-b border-hairline"
  >
    {/* Clicking the title row collapses, but not the controls inside it — the
        segmented switch handles its own clicks and stops propagation. */}
    <div
      className="flex items-center gap-4 min-w-0 cursor-pointer"
      onClick={onCollapse}
    >
      <span className="text-subheadline font-semibold text-text truncate">
        {title}
      </span>
      {children}
    </div>

    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onCollapse();
      }}
      className="text-muted hover:text-text transition-colors p-1.5 rounded-full hover:bg-hover shrink-0"
      title="Collapse dock"
      aria-label="Collapse dock"
    >
      <ChevronDown size={19} />
    </button>
  </div>
);