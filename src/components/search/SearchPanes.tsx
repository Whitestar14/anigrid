import React from "react";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  WifiOff,
} from "lucide-react";
import type { SearchError } from "@/hooks/useMediaSearch";

const PANE = "h-full min-h-32 flex flex-col items-center justify-center gap-2";

export const SearchLoadingPane: React.FC = () => (
  <div className={`${PANE} text-muted gap-2.5`}>
    <Loader2 className="animate-spin" size={18} />
    <span className="text-footnote">Searching…</span>
  </div>
);

export const SearchErrorPane: React.FC<{
  error: SearchError;
  onRetry: () => void;
}> = ({ error, onRetry }) => (
  <div className={`${PANE} text-muted gap-3 p-4 text-center`}>
    <div className="w-11 h-11 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
      {error.isNetwork ? <WifiOff size={20} /> : <AlertCircle size={20} />}
    </div>
    <span className="text-footnote font-medium text-text max-w-xs">
      {error.message}
    </span>
    <button
      type="button"
      onClick={onRetry}
      className="flex items-center gap-2 px-4 py-2 material-thin rounded-full text-footnote font-medium text-text active:scale-95 transition-transform"
    >
      <RefreshCw size={13} /> Try again
    </button>
  </div>
);

export const SearchEmptyPane: React.FC<{
  query: string;
  sourceLabel: string;
}> = ({ query, sourceLabel }) => (
  <div className={`${PANE} text-muted gap-1.5 text-center`}>
    <span className="text-subheadline font-semibold text-text">No results</span>
    <span className="text-caption-1 max-w-[220px]">
      Nothing matched “{query}” on {sourceLabel}. Try a different spelling, or
      switch where you search.
    </span>
  </div>
);

export const SearchIdlePane: React.FC = () => (
  <div className={`${PANE} text-muted select-none`}>
    <Search size={28} className="opacity-30" strokeWidth={1.5} />
    <span className="text-footnote">Search for posters and characters</span>
  </div>
);
