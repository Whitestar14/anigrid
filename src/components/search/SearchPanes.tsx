import React from "react";
import { CloudOff, RefreshCw, WifiOff } from "lucide-react";
import type { SearchError } from "@/hooks/useMediaSearch";
import { PixelSpinner } from "@/components/pixel/PixelSpinner";
import { PixelIcon } from "@/components/pixel/PixelIcon";

const PANE =
  "h-full min-h-40 flex flex-col items-center justify-center gap-3 px-5 text-center";

/**
 * The three states of a search that is not showing results.
 */

export const SearchLoadingPane: React.FC = () => (
  <div className={`${PANE} text-muted`}>
    <PixelSpinner cell={5} label="Searching" />
    <span className="text-footnote">Searching…</span>
  </div>
);

export const SearchErrorPane: React.FC<{
  error: SearchError;
  onRetry: () => void;
}> = ({ error, onRetry }) => {
  const offline = error.kind === "offline";

  return (
    <div className={PANE}>
      <div
        className="grid place-items-center w-12 h-12 rounded-card squircle
                   material-card text-muted"
        style={{ borderRadius: "var(--radius-control)" }}
      >
        {offline ? <WifiOff size={20} /> : <CloudOff size={20} />}
      </div>

      <div className="flex flex-col gap-1 max-w-[280px]">
        <span className="text-subheadline font-semibold text-text">
          {offline ? "You're offline" : "Search is taking a break"}
        </span>
        <span className="text-caption-1 text-muted leading-relaxed">
          {offline
            ? "Posters need a connection. Your boards keep working — everything on them is stored on this device."
            : "The catalogues did not answer. They rate-limit heavily, so this usually clears in a minute."}
        </span>
        {/* The provider's own message is kept, but demoted: it is the detail a
            bug report needs, not the sentence a reader needs. */}
        {!offline && error.detail && (
          <span className="mt-1 text-caption-2 text-faint line-clamp-2">
            {error.detail}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-2 h-9 px-4 material-thin rounded-full
                   text-footnote font-semibold text-text active:scale-95
                   transition-transform duration-150"
      >
        <RefreshCw size={13} />
        Try again
      </button>
    </div>
  );
};

export const SearchEmptyPane: React.FC<{
  query: string;
  sourceLabel: string;
}> = ({ query, sourceLabel }) => (
  <div className={PANE}>
    <PixelIcon name="search" size={22} className="text-muted opacity-60" />
    <div className="flex flex-col gap-1 max-w-[260px]">
      <span className="text-subheadline font-semibold text-text">
        Nothing found
      </span>
      <span className="text-caption-1 text-muted leading-relaxed">
        No match for <span className="text-text font-medium">“{query}”</span> on{" "}
        {sourceLabel}. Try a shorter spelling, or search a different catalogue.
      </span>
    </div>
  </div>
);

export const SearchIdlePane: React.FC = () => (
  <div className={`${PANE} text-muted select-none`}>
    <PixelIcon name="image" size={26} className="opacity-25" />
    <div className="flex flex-col gap-1 max-w-[240px]">
      <span className="text-footnote font-medium text-text">Find a poster</span>
      <span className="text-caption-1 leading-relaxed">
        Search an anime or a character, then tap a result to add it to the
        stash.
      </span>
    </div>
  </div>
);
