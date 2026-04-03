import { get, set } from 'idb-keyval';
import { GlobalState, TierRow } from '@/types';

const DB_KEY = 'anime-ranker-state';
const CURRENT_VERSION = 3;

export const saveState = async (state: GlobalState) => {
  try {
    await set(DB_KEY, state);
  } catch (err) {
    console.error('Failed to save state', err);
  }
};

const DEFAULT_TIER_ROWS: TierRow[] = [
    { id: 'tier-s', label: 'S', color: '#ff7f7f', items: [] },
    { id: 'tier-a', label: 'A', color: '#ffbf7f', items: [] },
    { id: 'tier-b', label: 'B', color: '#ffdf7f', items: [] },
    { id: 'tier-c', label: 'C', color: '#ffff7f', items: [] },
    { id: 'tier-d', label: 'D', color: '#bfff7f', items: [] },
    { id: 'tier-f', label: 'F', color: '#7fffff', items: [] },
];

const createDefaultState = (): GlobalState => {
  const rankId = `rank-${Date.now()}`;
  const colId = `col-${Date.now()}`;
  return {
    version: CURRENT_VERSION,
    activeRankId: rankId,
    theme: {
      accentColor: '#f43f5e',
      paletteId: 'midnight',
      isDark: true
    },
    ranks: {
      [rankId]: {
        id: rankId,
        title: 'My Ranking',
        type: 'ranking', // Changed default to Ranking/Grid
        mode: 'grid',
        config: { rows: 3, cols: 3 },
        cells: Array.from({ length: 9 }).map((_, i) => ({
          id: `cell-${i}`,
          imageSrc: null,
          position: i
        })),
        style: 'seamless',
        showNumbers: true,
        showTitle: true,
        showDate: true,
        gap: 8,
        backgroundColor: 'transparent', // Changed default to transparent
        tierRows: JSON.parse(JSON.stringify(DEFAULT_TIER_ROWS)),
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    },
    inbox: {
      collections: [
        { id: colId, name: 'General', items: [] }
      ],
      activeCollectionId: colId,
      lastTargetCollectionId: colId
    },
    preferences: {
      skipDuplicateWarning: false
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
          rank.tierRows = JSON.parse(JSON.stringify(DEFAULT_TIER_ROWS));
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
          accentColor: '#f43f5e',
          paletteId: 'midnight',
          isDark: true
      };
  }
  
  if (!data.preferences) {
      data.preferences = { skipDuplicateWarning: false };
  }

  return {
      ...data,
      version: CURRENT_VERSION
  } as GlobalState;
};

export const loadState = async (): Promise<GlobalState> => {
  try {
    const data = await get<any>(DB_KEY);
    const state = migrateState(data);
    return state || createDefaultState();
  } catch (err) {
    console.error('Failed to load state', err);
    return createDefaultState();
  }
};

export const exportStateToJson = (state: GlobalState) => {
  const dataStr = JSON.stringify(state);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const exportFileDefaultName = `anime-ranker-backup-${new Date().toISOString().slice(0,10)}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', url);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  
  URL.revokeObjectURL(url);
};