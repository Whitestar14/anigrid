import React, { useEffect, useRef, useState } from "react";
import { CloudOff, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { PopoverMenu } from "@/components/ui/PopoverMenu";
import { ScrollRail } from "@/components/ui/ScrollRail";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import {
  SearchEmptyPane,
  SearchErrorPane,
  SearchIdlePane,
  SearchLoadingPane,
} from "@/components/search/SearchPanes";
import { useMediaSearch } from "@/hooks/useMediaSearch";
import type { SearchMode, SourcePreference } from "@/core/metadata";

interface SearchPanelProps {
  query: string;
  onQueryChange: (q: string) => void;
  mode: SearchMode;
  onModeChange: (m: SearchMode) => void;
  onAdd: (imageSrc: string) => void;
  usedImageSrcs: Set<string>;
  autoFocus?: boolean;
  /** Which catalogue to ask first. */
  imageSource?: SourcePreference;
  onImageSourceChange?: (source: SourcePreference) => void;
}

/** Compact labels for the in-field pill — it shares a row with the query. */
const SOURCE_SHORT: Record<SourcePreference, string> = {
  auto: "Auto",
  myanimelist: "MAL",
  anilist: "AniList",
};

const SOURCE_OPTIONS: { value: SourcePreference; label: string }[] = [
  { value: "auto", label: "Automatic" },
  { value: "myanimelist", label: "MyAnimeList" },
  { value: "anilist", label: "AniList" },
];

export const SearchPanel: React.FC<SearchPanelProps> = ({
  query,
  onQueryChange,
  mode,
  onModeChange,
  onAdd,
  usedImageSrcs,
  autoFocus,
  imageSource = "auto",
  onImageSourceChange,
}) => {
  const { results, loading, error, degraded, answeredBy, hasSearched, retry } =
    useMediaSearch({ query, mode, prefer: imageSource });

  const [isSourceMenuOpen, setIsSourceMenuOpen] = useState(false);
  const [sourceAnchor, setSourceAnchor] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  /* Does the result grid run past the bottom of its scroller? Drives the fade
     that says there is more. A grid cut off mid-row looks complete. */
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollHeight > el.clientHeight + 8);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [results.length, loading, error]);

  const showEmpty = hasSearched && !loading && !error && results.length === 0;

  const openSourceMenu = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSourceAnchor({ x: rect.left + rect.width / 2, y: rect.bottom + 6 });
    setIsSourceMenuOpen(true);
  };

  return (
    <div className="flex flex-col h-full min-h-0 px-1 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 shrink-0">
        <div className="flex-1 min-w-0">
          <Input
            ref={inputRef}
            icon={<Search size={16} className="text-muted" />}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={`Search ${mode === "anime" ? "anime" : "characters"}`}
            className={`font-normal bg-surface-secondary border-transparent rounded-full h-9 pl-9
                        transition-[background-color,border-color,box-shadow] duration-150
                        ${isFocused ? "bg-surface-elevated border-primary/50 ring-2 ring-primary/15" : ""}`}
            trailing={
              <button
                type="button"
                onClick={openSourceMenu}
                aria-haspopup="menu"
                aria-expanded={isSourceMenuOpen}
                title="Where to search"
                className="flex items-center gap-1 h-[26px] pl-2 pr-2.5 rounded-full
                           bg-surface-secondary text-caption-1 font-semibold text-muted
                           hover:text-text hover:bg-hover transition-colors duration-150"
              >
                <SlidersHorizontal size={12} />
                <span className="tabular-nums">
                  {SOURCE_SHORT[imageSource]}
                </span>
              </button>
            }
          />
        </div>

        <div className="w-full sm:w-[132px] shrink-0">
          <SegmentedControl
            value={mode}
            onChange={(val) => onModeChange(val as SearchMode)}
            options={[
              { value: "anime", label: "Anime" },
              { value: "characters", label: "People" },
            ]}
          />
        </div>
      </div>

      {degraded && !loading && !error && results.length > 0 && answeredBy && (
        <div
          className="flex items-center gap-2 mb-2 pl-2.5 pr-1.5 py-1 shrink-0 min-w-0
                     material-card rounded-full text-caption-1 text-muted"
        >
          <CloudOff size={12} className="shrink-0" />
          <span className="truncate">
            {SOURCE_OPTIONS.find((o) => o.value === imageSource)?.label ??
              "Catalogue"}{" "}
            is unavailable — {answeredBy} answered
          </span>
          <button
            type="button"
            onClick={retry}
            aria-label="Try the preferred catalogue again"
            title="Try again"
            className="ml-auto grid place-items-center w-6 h-6 rounded-full shrink-0
                       text-muted hover:text-text hover:bg-hover transition-colors"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      )}

      <div className="relative flex-1 min-h-0">
        <div
          ref={listRef}
          className="h-full overflow-y-auto overflow-x-hidden scrollbar-ios overscroll-contain"
        >
          {loading ? (
            <SearchLoadingPane />
          ) : error ? (
            <SearchErrorPane error={error} onRetry={retry} />
          ) : results.length > 0 ? (
            <ScrollRail className="pb-2" contentClassName="pt-0.5" paging>
              {results.map((item) => (
                <SearchResultCard
                  key={item.id}
                  item={item}
                  isAdded={usedImageSrcs.has(item.imageUrl)}
                  onAdd={onAdd}
                />
              ))}
            </ScrollRail>
          ) : showEmpty ? (
            <SearchEmptyPane
              query={query.trim()}
              sourceLabel={SOURCE_SHORT[imageSource]}
            />
          ) : (
            <SearchIdlePane />
          )}
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-6 transition-opacity duration-200"
          style={{
            opacity: overflowing ? 1 : 0,
            background:
              "linear-gradient(to top, var(--color-surface-elevated), transparent)",
          }}
        />
      </div>

      <PopoverMenu
        isOpen={isSourceMenuOpen}
        onClose={() => setIsSourceMenuOpen(false)}
        triggerPoint={sourceAnchor}
        actions={SOURCE_OPTIONS.map((option) => ({
          label: option.label + (imageSource === option.value ? "  ✓" : ""),
          icon: option.value === "auto" ? SlidersHorizontal : Search,
          onClick: () => onImageSourceChange?.(option.value),
        }))}
      />
    </div>
  );
};
