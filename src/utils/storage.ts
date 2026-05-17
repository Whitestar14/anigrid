import { get, set, del } from 'idb-keyval';
import { StateStorage } from 'zustand/middleware';
import { GlobalState, TierRow, Rank, ProjectType } from '@/types';


const CURRENT_VERSION = 3;

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

export const createBlankRank = (type: ProjectType = 'ranking'): Rank => {
  const rankId = `rank-${Date.now()}`;
  return {
    id: rankId,
    title: type === 'tierlist' ? 'My Tier List' : 'My Ranking',
    type,
    mode: type === 'tierlist' ? 'tier' : 'grid',
    gridJustify: type === 'tierlist' ? 'left' : 'center',
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
    backgroundColor: '#1c1c1e',
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