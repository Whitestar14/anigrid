import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  Search,
  Loader2,
  AlertCircle,
  Plus,
  Check,
  RefreshCw,
  WifiOff,
  CloudOff,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { RemoteImage } from "@/components/ui/RemoteImage";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { PopoverMenu } from "@/components/ui/PopoverMenu";
import { ScrollRail } from "@/components/ui/ScrollRail";
import {
  searchMetadata,
  resetMetadataService,
  SOURCE_LABELS,
  type MediaResult,
  type SearchMode,
  type SourcePreference,
} from "@/core/metadata";

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

const DEBOUNCE_MS = 400;

/** Compact labels for the in-field pill — it shares a row with the query. */
const SOURCE_SHORT: Record<SourcePreference, string> = {
  auto: "Auto",
  myanimelist: "MAL",
  anilist: "AniList",
};

/* ── Result card ─────────────────────────────────────────────────────────── */

const ResultCard = React.memo<{
  item: MediaResult;
  isAdded: boolean;
  onAdd: (imageSrc: string) => void;
}>(({ item, isAdded, onAdd }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `search-${item.id}`,
    data: { type: "search-item", imageSrc: item.imageUrl },
  });

  return (
    <div className="flex flex-col gap-1.5 w-[92px] shrink-0">
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        title={item.title}
        className={`
          group/card relative aspect-[3/4] w-full overflow-hidden squircle cursor-grab
          material-card active:cursor-grabbing
          transition-transform duration-200 ease-spring
          ${isDragging ? "scale-95 opacity-50" : "hover:scale-[1.03]"}
        `}
        style={{
          borderRadius: "var(--radius-tile)",
          boxShadow: "inset 0 0 0 0.5px var(--material-hairline)",
        }}
      >
        <RemoteImage
          src={item.thumbnailUrl}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 w-full h-full ${
            isAdded ? "opacity-40 grayscale" : ""
          }`}
        />

        {/* Always visible. This was an `.affordance`, revealed on `.tile:hover`
            — and a search result is not a `.tile`, so the control was
            permanently invisible on any device with a real pointer. Adding a
            poster from search looked like a feature that did not exist. */}
        <button
          type="button"
          aria-label={isAdded ? "Already in library" : `Add ${item.title}`}
          onClick={(e) => {
            e.stopPropagation();
            if (!isAdded) onAdd(item.imageUrl);
          }}
          className={`absolute top-1.5 right-1.5 z-10 flex items-center justify-center w-[24px] h-[24px]
                      squircle transition-transform duration-150 touch-target
                      ${
                        isAdded
                          ? "bg-accent-green text-white"
                          : "material-thin text-text hover:scale-110 active:scale-95"
                      }`}
          style={{ borderRadius: 8 }}
        >
          {isAdded ? (
            <Check size={13} strokeWidth={3} />
          ) : (
            <Plus size={13} strokeWidth={3} />
          )}
        </button>
      </div>

      {/* `min-h` reserves the second line whether or not the title needs it, so
          the two rows of the grid are the same height and the lower row's text
          can never be pushed under the fade by a long title above it. */}
      <span className="text-caption-1 leading-tight text-muted line-clamp-2 px-0.5 min-h-[2.1em]">
        {item.title}
      </span>
    </div>
  );
});

/* ── Panel ───────────────────────────────────────────────────────────────── */

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
  const [results, setResults] = useState<MediaResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{
    message: string;
    isNetwork?: boolean;
  } | null>(null);
  const [answeredBy, setAnsweredBy] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSourceMenuOpen, setIsSourceMenuOpen] = useState(false);
  const [sourceAnchor, setSourceAnchor] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  /** Monotonic id so a slow response can never overwrite a newer one. */
  const requestId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const runSearch = useCallback(
    async (
      term: string,
      searchMode: SearchMode,
      prefer: SourcePreference,
      force = false
    ) => {
      const id = ++requestId.current;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        if (!navigator.onLine) throw new Error("offline");

        if (force) resetMetadataService();
        const response = await searchMetadata(term, searchMode, {
          signal: controller.signal,
          force,
          prefer,
        });

        if (id !== requestId.current) return; // superseded
        setResults(response.results);
        setAnsweredBy(SOURCE_LABELS[response.source]);
        setDegraded(response.degraded);
        setHasSearched(true);
      } catch (err) {
        if (id !== requestId.current) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults([]);
        setHasSearched(true);
        setError({
          message:
            err instanceof Error && err.message ? err.message : "Search failed.",
          isNetwork: err instanceof Error && err.message === "offline",
        });
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    []
  );

  // Debounced search on query/mode/source change.
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      requestId.current++;
      setResults([]);
      setHasSearched(false);
      setError(null);
      return;
    }
    const timer = setTimeout(
      () => runSearch(term, mode, imageSource),
      DEBOUNCE_MS
    );
    return () => clearTimeout(timer);
  }, [query, mode, imageSource, runSearch]);

  useEffect(() => () => abortRef.current?.abort(), []);

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
      {/* One row. The source selector used to be a third control beside the
          field, which on a phone squeezed the query down to a few characters.
          It now lives *inside* the field's trailing edge, so the header is just
          the query and the mode. */}
      <div className="flex items-center gap-2 mb-2 shrink-0">
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
                <span className="tabular-nums">{SOURCE_SHORT[imageSource]}</span>
              </button>
            }
          />
        </div>

        <div className="w-[132px] shrink-0">
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

      {degraded && !loading && !error && results.length > 0 && (
        /* One line, truncated. Two lines of explanation is enough height to
           push a row of results off the bottom of the panel — the note is
           worth saying, but not worth a row of posters. */
        <div className="flex items-center gap-1.5 mb-2 text-caption-1 text-muted shrink-0 min-w-0">
          <CloudOff size={12} className="shrink-0" />
          <span className="truncate">
            Showing {answeredBy} — preferred catalogue unavailable
          </span>
        </div>
      )}

      <div className="relative flex-1 min-h-0">
        <div
          ref={listRef}
          className="h-full overflow-y-auto overflow-x-hidden scrollbar-ios overscroll-contain"
        >
          {loading ? (
            <div className="h-full min-h-32 flex items-center justify-center text-muted gap-2.5">
              <Loader2 className="animate-spin" size={18} />
              <span className="text-footnote">Searching…</span>
            </div>
          ) : error ? (
            <div className="h-full min-h-32 flex flex-col items-center justify-center text-muted gap-3 p-4 text-center">
              <div className="w-11 h-11 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                {error.isNetwork ? <WifiOff size={20} /> : <AlertCircle size={20} />}
              </div>
              <span className="text-footnote font-medium text-text max-w-xs">
                {error.message}
              </span>
              <button
                type="button"
                onClick={() => runSearch(query.trim(), mode, imageSource, true)}
                className="flex items-center gap-2 px-4 py-2 material-thin rounded-full text-footnote font-medium text-text active:scale-95 transition-transform"
              >
                <RefreshCw size={13} /> Try again
              </button>
            </div>
          ) : results.length > 0 ? (
            <ScrollRail className="pb-2" contentClassName="pt-0.5">
              {results.map((item) => (
                <ResultCard
                  key={item.id}
                  item={item}
                  isAdded={usedImageSrcs.has(item.imageUrl)}
                  onAdd={onAdd}
                />
              ))}
            </ScrollRail>
          ) : showEmpty ? (
            <div className="h-full min-h-32 flex flex-col items-center justify-center text-muted gap-1.5 text-center">
              <span className="text-subheadline font-semibold text-text">
                No results
              </span>
              <span className="text-caption-1 max-w-[220px]">
                Nothing matched “{query.trim()}” on {SOURCE_SHORT[imageSource]}.
                Try a different spelling, or switch where you search.
              </span>
            </div>
          ) : (
            <div className="h-full min-h-32 flex flex-col items-center justify-center text-muted gap-2 select-none">
              <Search size={28} className="opacity-30" strokeWidth={1.5} />
              <span className="text-footnote">
                Search for posters and characters
              </span>
            </div>
          )}
        </div>

        {/* "There is more below." Kept short — a tall fade eats the lower row's
            labels on a phone, which is exactly where it must not. */}
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
        actions={(
          [
            {
              value: "auto",
              label: "Automatic",
            },
            { value: "myanimelist", label: "MyAnimeList" },
            { value: "anilist", label: "AniList" },
          ] as { value: SourcePreference; label: string }[]
        ).map((option) => ({
          label:
            option.label +
            (imageSource === option.value ? "  ✓" : ""),
          icon: option.value === "auto" ? SlidersHorizontal : Search,
          onClick: () => onImageSourceChange?.(option.value),
        }))}
      />
    </div>
  );
};
