import { get, set, del } from 'idb-keyval';
import { StateStorage } from 'zustand/middleware';
import { GlobalState, TierRow, Rank, ProjectType } from '@/types';


const CURRENT_VERSION = 4;

export const ACCENT_BLUE_DARK = '#0a84ff';
export const ACCENT_BLUE_LIGHT = '#007aff';

/** The rose this app shipped as its untouched default before version 4. */
export const LEGACY_DEFAULT_ACCENT = '#f43f5e';

export const systemAccentFor = (isDark: boolean) =>
  isDark ? ACCENT_BLUE_DARK : ACCENT_BLUE_LIGHT;

export const defaultBoardBackground = (isDark: boolean) =>
  isDark ? '#1c1c1e' : '#ffffff';

export const migratePersistedState = (persisted: any) => {
  if (!persisted || typeof persisted !== 'object') return persisted;
  const theme = persisted.theme;
  if (theme && theme.accentColor === LEGACY_DEFAULT_ACCENT) {
    theme.accentColor = systemAccentFor(theme.isDark ?? true);
  }
  return persisted;
};

// Custom storage for idb-keyval
export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await get(name);
    if (!value) return null;
    return JSON.stringify(value);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, JSON.parse(value));
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};



const createDefaultTierRows = (): TierRow[] => [
    { id: 'tier-s', label: 'S', color: '#ff7f7f', items: [] },
    { id: 'tier-a', label: 'A', color: '#ffbf7f', items: [] },
    { id: 'tier-b', label: 'B', color: '#ffdf7f', items: [] },
    { id: 'tier-c', label: 'C', color: '#ffff7f', items: [] },
    { id: 'tier-d', label: 'D', color: '#bfff7f', items: [] },
    { id: 'tier-f', label: 'F', color: '#7fffff', items: [] },
];

export const createBlankRank = (
  type: ProjectType = 'ranking',
  /** Board sheet for the new project; follows the active appearance. */
  backgroundColor: string = defaultBoardBackground(true)
): Rank => {
  const rankId = `rank-${Date.now()}`;
  return {
    id: rankId,
    title: type === 'tierlist' ? 'My Tier List' : type === 'list' ? 'My List' : 'My Ranking',
    type,
    gridJustify: type === 'tierlist' ? 'left' : 'center',
    config: { rows: type === 'list' ? 5 : 3, cols: 3 },
    cells: Array.from({ length: type === 'list' ? 5 : 9 }).map((_, i) => ({
      id: `cell-${i}-${Date.now()}`,
      imageSrc: null,
      position: i
    })),
    style: 'seamless',
    showNumbers: true,
    showTitle: true,
    showDate: true,
    gap: 0,
    backgroundColor,
    tierRows: createDefaultTierRows(),
    createdAt: Date.now(),
    updatedAt: Date.now()
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
    borderRadius: source.borderRadius,
    gap: source.gap,
    gridJustify: source.gridJustify,
    backgroundColor: source.backgroundColor,
    tierRows: source.tierRows.map((row) => ({
      ...row,
      id: `tier-${row.label}-${now}-${Math.random().toString(36).slice(2, 6)}`,
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
  const rank = createBlankRank('ranking');
  const colId = `col-${Date.now()}`;
  return {
    version: CURRENT_VERSION,
    activeRankId: rank.id,
    theme: {
      accentColor: ACCENT_BLUE_DARK,
      paletteId: 'ios-dark',
      isDark: true
    },
    ranks: {
      [rank.id]: rank
    },
    inbox: {
      collections: [
        { id: colId, name: 'General', items: [] }
      ],
      activeCollectionId: colId,
      lastTargetCollectionId: colId,
      isDraggingFromDock: false
    },
    preferences: {
      skipDuplicateWarning: false,
      reduceGlassEffects: false,
      autoCloseDockOnDragDesktop: false,
    }
  };
};



export const exportStateToJson = (state: GlobalState) => {
  const dataStr = JSON.stringify(state);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const exportFileDefaultName = `anime-ranker-backup-${new Date().toISOString().slice(0, 10)}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', url);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();

  URL.revokeObjectURL(url);
};