import { get, set, del } from "idb-keyval";
import { StateStorage } from "zustand/middleware";
import { GlobalState, TierRow, Rank, ProjectType } from "@/types";
import { DEFAULT_TIER_COLORS } from "@/constants/tierColors";
import { normalizeTierColor } from "@/utils/dominantColor";

const CURRENT_VERSION = 4;

export const ACCENT_BLUE_DARK = "#0a84ff";
export const ACCENT_BLUE_LIGHT = "#007aff";

/** The rose this app shipped as its untouched default before version 4. */
export const LEGACY_DEFAULT_ACCENT = "#f43f5e";

export const systemAccentFor = (isDark: boolean) =>
  isDark ? ACCENT_BLUE_DARK : ACCENT_BLUE_LIGHT;

export const defaultBoardBackground = (isDark: boolean) =>
  isDark ? "#1c1c1e" : "#ffffff";

export const migratePersistedState = (persisted: any) => {
  if (!persisted || typeof persisted !== "object") return persisted;
  const theme = persisted.theme;
  if (theme && theme.accentColor === LEGACY_DEFAULT_ACCENT) {
    theme.accentColor = systemAccentFor(theme.isDark ?? true);
  }
  return persisted;
};

/**
 * How long writes are held before hitting IndexedDB.
 */
const WRITE_DELAY = 250;

let pending: { name: string; value: string } | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

/** Writes whatever is held. Called by the timer and before the page unloads. */
export const flushPersistedState = (): void => {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
  if (!pending) return;
  const { name, value } = pending;
  pending = null;
  void set(name, value).catch((err) =>
    console.error("Failed to persist state", err),
  );
};

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushPersistedState);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushPersistedState();
  });
}

/**
 * The store's IndexedDB storage.
 */
export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    // A held write is newer than what is on disk, so it wins.
    if (pending?.name === name) return pending.value;
    const value = await get(name);
    if (value === undefined || value === null) return null;
    // States written before this change were stored as objects.
    return typeof value === "string" ? value : JSON.stringify(value);
  },
  setItem: (name: string, value: string): Promise<void> => {
    pending = { name, value };
    if (timer === null) timer = setTimeout(flushPersistedState, WRITE_DELAY);
    return Promise.resolve();
  },
  removeItem: async (name: string): Promise<void> => {
    pending = null;
    await del(name);
  },
};

/** The tiers a tier list opens with, painted from the shared palette. */
const DEFAULT_TIER_LABELS = ["S", "A", "B", "C", "D", "F"];

const createDefaultTierRows = (): TierRow[] =>
  DEFAULT_TIER_LABELS.map((label, i) => ({
    id: `tier-${label.toLowerCase()}`,
    label,
    color: DEFAULT_TIER_COLORS[i],
    items: [],
  }));

export const createBlankRank = (
  type: ProjectType = "ranking",
  /** Board sheet for the new project; follows the active appearance. */
  backgroundColor: string = defaultBoardBackground(true),
): Rank => {
  const rankId = `rank-${Date.now()}`;
  return {
    id: rankId,
    title:
      type === "tierlist"
        ? "My Tier List"
        : type === "list"
          ? "My List"
          : "My Ranking",
    type,
    gridJustify: type === "tierlist" ? "left" : "center",
    config: { rows: type === "list" ? 5 : 3, cols: 3 },
    cells: Array.from({ length: type === "list" ? 5 : 9 }).map((_, i) => ({
      id: `cell-${i}-${Date.now()}`,
      imageSrc: null,
      position: i,
    })),
    style: "seamless",
    showNumbers: true,
    showTitle: true,
    showDate: true,
    showWatermark: true,
    gap: 0,
    backgroundColor,
    tierRows: createDefaultTierRows(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

export const createRankLike = (source: Rank): Rank => {
  const type = source.type;
  const blank = createBlankRank(type);
  const cellCount = source.cells?.length || (type === "list" ? 5 : 9);
  const now = Date.now();

  return {
    ...blank,
    title: nextUntitled(source.title),
    // A project's shape is its own, not its content.
    config: { ...source.config },
    cells: Array.from({ length: cellCount }).map((_, i) => ({
      id: `cell-${i}-${now}`,
      imageSrc: null,
      position: i,
    })),
    style: source.style,
    showNumbers: source.showNumbers,
    showTitle: source.showTitle,
    showDate: source.showDate,
    showWatermark: source.showWatermark,
    showTiers: source.showTiers,
    borderless: source.borderless,
    aspectRatio: source.aspectRatio,
    cellWidth: source.cellWidth,
    tierRowHeight: source.tierRowHeight,
    borderRadius: source.borderRadius,
    gap: source.gap,
    gridJustify: source.gridJustify,
    backgroundColor: source.backgroundColor,
    tierRows: source.tierRows.map((row) => ({
      ...row,
      id: `tier-${row.label}-${now}-${Math.random().toString(36).slice(2, 6)}`,
      color: normalizeTierColor(row.color),
      items: [],
    })),
  };
};

/** "My Ranking" -> "My Ranking 2"; never returns the source title itself. */
const nextUntitled = (title: string): string => {
  const match = /^(.*?)\s+(\d+)$/.exec(title.trim());
  if (match) return `${match[1]} ${Number(match[2]) + 1}`;
  return `${title.trim()} 2`;
};

export const createDefaultState = (): GlobalState => {
  const rank = createBlankRank("ranking");
  const colId = `col-${Date.now()}`;
  return {
    version: CURRENT_VERSION,
    activeRankId: rank.id,
    theme: {
      accentColor: ACCENT_BLUE_DARK,
      paletteId: "ios-dark",
      isDark: true,
    },
    ranks: {
      [rank.id]: rank,
    },
    inbox: {
      collections: [{ id: colId, name: "General", items: [] }],
      activeCollectionId: colId,
      lastTargetCollectionId: colId,
      isDraggingFromDock: false,
    },
    preferences: {
      skipDuplicateWarning: false,
      reduceGlassEffects: false,
      autoCloseDockOnDragDesktop: false,
    },
  };
};

export const exportStateToJson = (state: GlobalState) => {
  const dataStr = JSON.stringify(state);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const exportFileDefaultName = `anime-ranker-backup-${new Date().toISOString().slice(0, 10)}.json`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", url);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();

  URL.revokeObjectURL(url);
};
