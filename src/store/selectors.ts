import { createSelector } from 'reselect';
import { AppState } from './useStore';

// Basic selectors
export const selectActiveRankId = (state: AppState) => state.activeRankId;
export const selectRanks = (state: AppState) => state.ranks;
export const selectInbox = (state: AppState) => state.inbox;
export const selectTheme = (state: AppState) => state.theme;
export const selectPreferences = (state: AppState) => state.preferences;

// Memoized selectors
export const selectActiveRank = createSelector(
  [selectRanks, selectActiveRankId],
  (ranks, activeRankId) => ranks[activeRankId]
);

export const selectCells = createSelector(
  [selectActiveRank],
  (activeRank) => activeRank?.cells || []
);

export const selectTierRows = createSelector(
  [selectActiveRank],
  (activeRank) => activeRank?.tierRows || []
);

export const selectActiveCollectionId = createSelector(
  [selectInbox],
  (inbox) => inbox.activeCollectionId
);

export const selectCollections = createSelector(
  [selectInbox],
  (inbox) => inbox.collections
);

export const selectActiveCollection = createSelector(
  [selectCollections, selectActiveCollectionId],
  (collections, activeCollectionId) => 
    collections.find(c => c.id === activeCollectionId)
);

// Parameterized selectors (Note: these are not memoized across different parameters by default in reselect 5)
// But they provide a clean API for components
export const selectCellByIndex = (index: number) => createSelector(
  [selectCells],
  (cells) => cells[index]
);

export const selectTierRowById = (rowId: string) => createSelector(
  [selectTierRows],
  (rows) => rows.find(r => r.id === rowId)
);

export const selectTierItem = (rowId: string, index: number) => createSelector(
  [selectTierRowById(rowId)],
  (row) => row?.items[index]
);
