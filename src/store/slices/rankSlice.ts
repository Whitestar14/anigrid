import { StateCreator } from "zustand";
import { AppState } from "../useStore";
import { TierRow, ProjectType, GridConfig, RankMode, CellData, InboxItem } from "@/types";
import { checkAndRescueImages, ensureCells, findInboxItem, findInboxItems } from "@/utils/storeUtils";
import { createBlankRank } from "@/utils/storage";

export interface RankSlice {
  updateActiveRank: (updates: Partial<AppState["ranks"][string]>) => void;
  updateRankById: (id: string, updates: Partial<AppState["ranks"][string]>) => void;
  handleConfigChange: (newConfig: GridConfig) => void;
  handleModeChange: (newMode: RankMode) => void;
  handleVisualToggle: (
    key: "showNumbers" | "showTitle" | "showDate" | "showTiers" | "borderless"
  ) => void;
  handleCellUpload: (index: number, dataUrl: string) => void;
  handleUpdateCell: (index: number, data: Partial<CellData>) => void;
  handleCellClear: (index: number) => void;
  handleSwapCells: (fromIndex: number, toIndex: number) => void;
  handleMoveToInbox: (index: number) => void;
  handleUpdateTierRows: (rows: TierRow[]) => void;
  handleTierItemRemove: (rowId: string, itemId: string) => void;
  handleReorderCells: (fromIndex: number, toIndex: number) => void;
  handleUpdateTierItem: (rowId: string, itemId: string, updates: Partial<CellData>) => void;
  recallItemByImageSrc: (imageSrc: string) => void;
  handleTierMoveToInbox: (rowId: string, itemIndex: number) => void;
  handleInboxDropToTier: (
    itemId: string,
    collectionId: string,
    rowId: string,
    targetIndex: number
  ) => void;
  handleInboxDropToTierMulti: (
    itemIds: string[],
    collectionId: string,
    rowId: string,
    targetIndex: number
  ) => void;
  handleSearchDropToTier: (
    imageSrc: string,
    rowId: string,
    targetIndex: number
  ) => void;
  handleInternalTierMove: (
    sourceRowId: string,
    sourceItemId: string,
    targetRowId: string,
    targetIndex: number
  ) => void;
  handleNewRank: (type: ProjectType) => void;
  handleDeleteRank: (id: string) => void;
  setActiveRankId: (id: string) => void;
}

export const createRankSlice: StateCreator<
  AppState,
  [["zustand/temporal", unknown], ["zustand/immer", never]],
  [],
  RankSlice
> = (set, get) => ({
  updateActiveRank: (updates) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (current) {
        Object.assign(current, updates);
        current.updatedAt = Date.now();
      }
    }),
  updateRankById: (id, updates) =>
    set((state) => {
      const current = state.ranks[id];
      if (current) {
        Object.assign(current, updates);
        current.updatedAt = Date.now();
      }
    }),
  handleConfigChange: (newConfig) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (!current) return;
      
      const totalCells = current.mode === "list" ? newConfig.rows : newConfig.rows * newConfig.cols;
      
      if (totalCells > current.cells.length) {
        ensureCells(current.cells, totalCells - 1);
      } else if (totalCells < current.cells.length) {
        current.cells = current.cells.slice(0, totalCells);
      }
      current.config = newConfig;
      current.updatedAt = Date.now();
    }),
  handleModeChange: (newMode) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (current) {
        current.mode = newMode;
        current.updatedAt = Date.now();
      }
    }),
  handleVisualToggle: (key) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (current) {
        (current as any)[key] = !(current as any)[key];
        current.updatedAt = Date.now();
      }
    }),
  handleCellUpload: (index, dataUrl) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (current && current.cells[index]) {
        current.cells[index].imageSrc = dataUrl;
        current.updatedAt = Date.now();
      }
    }),
  handleUpdateCell: (index, data) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (current && current.cells[index]) {
        Object.assign(current.cells[index], data);
        current.updatedAt = Date.now();
      }
    }),
  handleCellClear: (index) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (current && current.cells[index]) {
        current.cells[index].imageSrc = null;
        current.cells[index].textLabel = undefined;
        current.cells[index].rating = undefined;
        current.updatedAt = Date.now();
      }
    }),
  handleSwapCells: (fromIndex, toIndex) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (current && current.cells[fromIndex] && current.cells[toIndex]) {
        const tempImage = current.cells[fromIndex].imageSrc;
        const tempLabel = current.cells[fromIndex].textLabel;
        const tempRating = current.cells[fromIndex].rating;

        current.cells[fromIndex].imageSrc = current.cells[toIndex].imageSrc;
        current.cells[fromIndex].textLabel = current.cells[toIndex].textLabel;
        current.cells[fromIndex].rating = current.cells[toIndex].rating;

        current.cells[toIndex].imageSrc = tempImage;
        current.cells[toIndex].textLabel = tempLabel;
        current.cells[toIndex].rating = tempRating;

        current.updatedAt = Date.now();
      }
    }),
  handleReorderCells: (fromIndex, toIndex) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (current && fromIndex !== toIndex) {
        const [movedItem] = current.cells.splice(fromIndex, 1);
        current.cells.splice(toIndex, 0, movedItem);
        current.updatedAt = Date.now();
      }
    }),
  handleMoveToInbox: (index) =>
    set((state) => {
      const currentRank = state.ranks[state.activeRankId];
      if (!currentRank) return;
      const cell = currentRank.cells[index];
      if (!cell.imageSrc) return;

      const targetColId =
        state.inbox.activeCollectionId === "all-images"
          ? state.inbox.collections[0].id
          : state.inbox.activeCollectionId;

      const col = state.inbox.collections.find((c) => c.id === targetColId);
      if (col) {
        col.items.push({
          id: `inbox-moved-${Date.now()}`,
          imageSrc: cell.imageSrc,
          createdAt: Date.now(),
        });
      }

      cell.imageSrc = null;
      cell.textLabel = undefined;
      cell.rating = undefined;
      currentRank.updatedAt = Date.now();
    }),
  handleUpdateTierRows: (rows) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (current) {
        current.tierRows = rows;
        current.updatedAt = Date.now();
      }
    }),
  handleTierItemRemove: (rowId, itemId) =>
    set((state) => {
      const activeRank = state.ranks[state.activeRankId];
      if (!activeRank) return;
      const row = activeRank.tierRows.find((r) => r.id === rowId);
      if (!row) return;

      const item = row.items.find((i) => i.id === itemId);
      if (item && item.imageSrc) {
        const targetColId =
          state.inbox.activeCollectionId === "all-images"
            ? state.inbox.collections[0].id
            : state.inbox.activeCollectionId;
        const rescued = checkAndRescueImages([item], state, targetColId);
        const col = state.inbox.collections.find((c) => c.id === targetColId);
        if (col && rescued.length > 0) {
          col.items.push(...rescued);
        }
      }

      row.items = row.items.filter((i) => i.id !== itemId);
      activeRank.updatedAt = Date.now();
    }),
  handleUpdateTierItem: (rowId, itemId, updates) =>
    set((state) => {
      const activeRank = state.ranks[state.activeRankId];
      if (!activeRank) return;
      const row = activeRank.tierRows.find((r) => r.id === rowId);
      if (!row) return;
      const item = row.items.find((i) => i.id === itemId);
      if (item) {
        Object.assign(item, updates);
        activeRank.updatedAt = Date.now();
      }
    }),
  recallItemByImageSrc: (imageSrc) =>
    set((state) => {
      const currentRank = state.ranks[state.activeRankId];
      if (!currentRank) return;

      currentRank.cells.forEach((c) => {
        if (c.imageSrc === imageSrc) c.imageSrc = null;
      });

      currentRank.tierRows.forEach((r) => {
        r.items = r.items.filter((i) => i.imageSrc !== imageSrc);
      });

      currentRank.updatedAt = Date.now();
    }),
  handleTierMoveToInbox: (rowId, itemIndex) =>
    set((state) => {
      const activeRank = state.ranks[state.activeRankId];
      if (!activeRank) return;
      const row = activeRank.tierRows.find((r) => r.id === rowId);
      if (!row || !row.items[itemIndex]) return;

      const item = row.items[itemIndex];
      const targetColId =
        state.inbox.activeCollectionId === "all-images"
          ? state.inbox.collections[0].id
          : state.inbox.activeCollectionId;

      const rescued = checkAndRescueImages([item], state, targetColId);
      const col = state.inbox.collections.find((c) => c.id === targetColId);
      if (col && rescued.length > 0) {
        col.items.push(...rescued);
      }

      row.items.splice(itemIndex, 1);
      activeRank.updatedAt = Date.now();
    }),
  handleInboxDropToTier: (itemId, collectionId, rowId, targetIndex) => {
    const state = get();
    const item = findInboxItem(state.inbox, itemId, collectionId);
    if (!item) return;

    state.checkDuplicateAndProceed(item.imageSrc, () => {
      set((draft) => {
        const currentRank = draft.ranks[draft.activeRankId];
        if (!currentRank) return;
        const row = currentRank.tierRows.find((r) => r.id === rowId);
        if (!row) return;

        const newCellData: CellData = {
          id: `tier-cell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          imageSrc: item.imageSrc,
          position: 0,
        };

        const insertIdx = targetIndex === -1 ? row.items.length : targetIndex;
        row.items.splice(insertIdx, 0, newCellData);
        currentRank.updatedAt = Date.now();
      });
    });
  },
  handleInboxDropToTierMulti: (itemIds, collectionId, rowId, targetIndex) => {
    const state = get();
    const validItems = findInboxItems(state.inbox, itemIds, collectionId);
    if (validItems.length === 0) return;

    set((draft) => {
      const currentRank = draft.ranks[draft.activeRankId];
      if (!currentRank) return;
      const row = currentRank.tierRows.find((r) => r.id === rowId);
      if (!row) return;

      const validToDrop = validItems.filter((item) => {
        if (draft.preferences.skipDuplicateWarning) return true;
        return !currentRank.tierRows.some((r) =>
          r.items.some((i) => i.imageSrc === item.imageSrc)
        );
      });

      if (validToDrop.length === 0) return;

      const itemsToAdd = validToDrop.map((item) => ({
        id: `cell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        imageSrc: item.imageSrc,
        position: 0,
      }));

      const insertIdx = targetIndex === -1 || targetIndex >= row.items.length ? row.items.length : targetIndex;
      row.items.splice(insertIdx, 0, ...itemsToAdd);
      currentRank.updatedAt = Date.now();
    });
  },
  handleSearchDropToTier: (imageSrc, rowId, targetIndex) => {
    const state = get();
    state.checkDuplicateAndProceed(imageSrc, () => {
      let cellId = "";
      set((draft) => {
        const currentRank = draft.ranks[draft.activeRankId];
        if (!currentRank) return;
        const row = currentRank.tierRows.find((r) => r.id === rowId);
        if (!row) return;

        cellId = `tier-cell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        row.items.splice(targetIndex === -1 ? row.items.length : targetIndex, 0, {
          id: cellId,
          imageSrc,
          position: 0,
        });

        // Add to inbox
        const activeColId =
          draft.inbox.activeCollectionId === "all-images"
            ? draft.inbox.collections[0].id
            : draft.inbox.activeCollectionId;
        const col = draft.inbox.collections.find((c) => c.id === activeColId);
        if (col && !col.items.some((i) => i.imageSrc === imageSrc)) {
          col.items.push({
            id: `inbox-add-${Date.now()}`,
            imageSrc,
            createdAt: Date.now(),
          });
        }
        currentRank.updatedAt = Date.now();
      });

      // Background Optimization: Fetch and cache as base64
      if (cellId) {
        import("@/utils/imageProxy").then(({ fetchAndCacheImage }) => {
          fetchAndCacheImage(imageSrc).then(base64 => {
            if (base64) {
              set(d => {
                const r = d.ranks[d.activeRankId];
                if (!r) return;
                const row = r.tierRows.find(tr => tr.id === rowId);
                if (!row) return;
                const item = row.items.find(i => i.id === cellId);
                if (item) item.imageSrc = base64;
                
                // Also update in inbox
                d.inbox.collections.forEach(c => {
                  c.items.forEach(it => {
                    if (it.imageSrc === imageSrc) it.imageSrc = base64;
                  });
                });
              });
            }
          });
        });
      }
    });
  },
  handleInternalTierMove: (sourceRowId, sourceItemId, targetRowId, targetIndex) =>
    set((state) => {
      const activeRank = state.ranks[state.activeRankId];
      if (!activeRank) return;

      const sRow = activeRank.tierRows.find((r) => r.id === sourceRowId);
      const tRow = activeRank.tierRows.find((r) => r.id === targetRowId);
      if (!sRow || !tRow) return;

      const itemIdx = sRow.items.findIndex((i) => i.id === sourceItemId);
      if (itemIdx === -1) return;

      const [movedItem] = sRow.items.splice(itemIdx, 1);

      let adjTarget = targetIndex;
      if (sourceRowId === targetRowId && targetIndex !== -1 && itemIdx < targetIndex) {
        adjTarget -= 1;
      }

      if (adjTarget === -1 || adjTarget >= tRow.items.length) {
        tRow.items.push(movedItem);
      } else {
        tRow.items.splice(adjTarget, 0, movedItem);
      }
      activeRank.updatedAt = Date.now();
    }),
  handleNewRank: (type) =>
    set((state) => {
      const newRank = createBlankRank(type);
      state.activeRankId = newRank.id;
      state.ranks[newRank.id] = newRank as any;
    }),
  handleDeleteRank: (id) =>
    set((state) => {
      delete state.ranks[id];
      const remainingIds = Object.keys(state.ranks);
      if (remainingIds.length === 0) {
        const newRank = createBlankRank("ranking");
        state.activeRankId = newRank.id;
        state.ranks[newRank.id] = newRank as any;
      } else if (state.activeRankId === id) {
        state.activeRankId = remainingIds[0];
      }
    }),
  setActiveRankId: (id) =>
    set((state) => {
      state.activeRankId = id;
    }),
});
