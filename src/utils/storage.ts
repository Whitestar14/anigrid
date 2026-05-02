import { get, set, del } from 'idb-keyval';
import { StateStorage } from 'zustand/middleware';
import { GlobalState, TierRow, Rank, ProjectType } from '@/types';


const CURRENT_VERSION = 3;

// Custom storage for idb-keyval
export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await get(name);
    if (!value) return null;
    // If it's the old format (doesn't have a 'state' wrapper), wrap it
    if (!value.state && value.ranks) {
      return JSON.stringify({ state: value, version: value.version || 1 });
    }
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

export const createBlankRank = (type: ProjectType = 'ranking'): Rank => {
  const rankId = `rank-${Date.now()}`;
  return {
    id: rankId,
    title: type === 'tierlist' ? 'My Tier List' : 'My Ranking',
    type,
    mode: type === 'tierlist' ? 'tier' : 'grid',
    config: { rows: 3, cols: 3 },
    cells: Array.from({ length: 9 }).map((_, i) => ({
      id: `cell-${i}-${Date.now()}`,
      imageSrc: null,
      position: i
    })),
    style: 'seamless',
    showNumbers: true,
    showTitle: true,
    showDate: true,
    gap: 0,
    backgroundColor: 'transparent',
    tierRows: createDefaultTierRows(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
};

export const createDefaultState = (): GlobalState => {
  const rank = createBlankRank('ranking');
  const colId = `col-${Date.now()}`;
  return {
    version: CURRENT_VERSION,
    activeRankId: rank.id,
    theme: {
      accentColor: '#f43f5e',
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

export const migrateState = (data: any): GlobalState | null => {
  if (!data) return null;

  // Migration logic
  const ranks = data.ranks || {};
  Object.values(ranks).forEach((rank: any) => {
    // Ensure tierRows exists
    if (!rank.tierRows) {
      rank.tierRows = createDefaultTierRows();
    }

    // Basic property checks
    if (typeof rank.showTitle === 'undefined') rank.showTitle = true;
    if (typeof rank.showDate === 'undefined') rank.showDate = true;
    if (typeof rank.gap === 'undefined') rank.gap = rank.style === 'card' ? 16 : 0;
    if (typeof rank.backgroundColor === 'undefined') rank.backgroundColor = 'transparent';
    if (typeof rank.mode === 'undefined') rank.mode = 'grid';

    // V3 Migration: Assign type based on mode
    if (!rank.type) {
      rank.type = rank.mode === 'tier' ? 'tierlist' : 'ranking';
    }
  });

  if (!data.theme) {
    data.theme = {
      accentColor: '#0a84ff',
      paletteId: 'ios-dark',
      isDark: true
    };
  }

  if (!data.preferences) {
    data.preferences = {
      skipDuplicateWarning: false,
      reduceGlassEffects: false,
      autoCloseDockOnDragDesktop: false,
    };
  } else {
    if (typeof data.preferences.reduceGlassEffects !== 'boolean') {
      data.preferences.reduceGlassEffects = false;
    }
    if (typeof data.preferences.autoCloseDockOnDragDesktop !== 'boolean') {
      data.preferences.autoCloseDockOnDragDesktop = false;
    }
  }

  return {
    ...data,
    version: CURRENT_VERSION
  } as GlobalState;
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