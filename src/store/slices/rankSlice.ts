import { StateCreator } from "zustand";
import { AppState } from "../useStore";
import { TierRow, ProjectType, GridConfig, RankMode, CellData, InboxItem } from "@/types";
import { checkAndRescueImages } from "@/utils/storeUtils";
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
  [["zustand/temporal", unknown]],
  [],
  RankSlice
> = (set, get) => ({
  updateActiveRank: (updates) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (!current) return state;
      return {
        ranks: {
          ...state.ranks,
          [state.activeRankId]: { ...current, ...updates, updatedAt: Date.now() },
        },
      };
    }),
  updateRankById: (id, updates) =>
    set((state) => {
      const current = state.ranks[id];
      if (!current) return state;
      return {
        ranks: {
          ...state.ranks,
          [id]: { ...current, ...updates, updatedAt: Date.now() },
        },
      };
    }),
  handleConfigChange: (newConfig) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (!current) return state;
      const totalCells = newConfig.rows * newConfig.cols;
      let newCells = [...current.cells];
      if (totalCells > newCells.length) {
        const toAdd = totalCells - newCells.length;
        const startIdx = newCells.length;
        newCells = [
          ...newCells,
          ...Array.from({ length: toAdd }).map((_, i) => ({
            id: `cell-${startIdx + i}-${Date.now()}`,
            imageSrc: null,
            position: startIdx + i,
          })),
        ];
      } else if (totalCells < newCells.length) {
        newCells = newCells.slice(0, totalCells);
      }
      return {
        ranks: {
          ...state.ranks,
          [state.activeRankId]: {
            ...current,
            config: newConfig,
            cells: newCells,
            updatedAt: Date.now(),
          },
        },
      };
    }),
  handleModeChange: (newMode) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (!current) return state;
      return {
        ranks: {
          ...state.ranks,
          [state.activeRankId]: {
            ...current,
            mode: newMode,
            updatedAt: Date.now(),
          },
        },
      };
    }),
  handleVisualToggle: (key) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (!current) return state;
      return {
        ranks: {
          ...state.ranks,
          [state.activeRankId]: {
            ...current,
            [key]: !(current as any)[key],
            updatedAt: Date.now(),
          },
        },
      };
    }),
  handleCellUpload: (index, dataUrl) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (!current) return state;
      const newCells = [...current.cells];
      newCells[index] = { ...newCells[index], imageSrc: dataUrl };
      return {
        ranks: {
          ...state.ranks,
          [state.activeRankId]: {
            ...current,
            cells: newCells,
            updatedAt: Date.now(),
          },
        },
      };
    }),
  handleUpdateCell: (index, data) =>
    set((state) => {
      const currentRank = state.ranks[state.activeRankId];
      if (!currentRank) return state;
      const newCells = [...currentRank.cells];
      newCells[index] = { ...newCells[index], ...data };
      return {
        ranks: {
          ...state.ranks,
          [state.activeRankId]: {
            ...currentRank,
            cells: newCells,
            updatedAt: Date.now(),
          },
        },
      };
    }),
  handleCellClear: (index) =>
    set((state) => {
      const currentRank = state.ranks[state.activeRankId];
      if (!currentRank) return state;
      const newCells = [...currentRank.cells];
      newCells[index] = {
        ...newCells[index],
        imageSrc: null,
        textLabel: undefined,
        rating: undefined,
      };
      return {
        ranks: {
          ...state.ranks,
          [state.activeRankId]: {
            ...currentRank,
            cells: newCells,
            updatedAt: Date.now(),
          },
        },
      };
    }),
  handleSwapCells: (fromIndex, toIndex) =>
    set((state) => {
      const currentRank = state.ranks[state.activeRankId];
      if (!currentRank) return state;
      const newCells = [...currentRank.cells];
      const temp = { ...newCells[fromIndex] };
      newCells[fromIndex] = { ...newCells[toIndex], id: newCells[fromIndex].id };
      newCells[toIndex] = { ...temp, id: newCells[toIndex].id };
      return {
        ranks: {
          ...state.ranks,
          [state.activeRankId]: {
            ...currentRank,
            cells: newCells,
            updatedAt: Date.now(),
          },
        },
      };
    }),
  handleMoveToInbox: (index) =>
    set((state) => {
      const currentRank = state.ranks[state.activeRankId];
      if (!currentRank) return state;
      const cell = currentRank.cells[index];
      if (!cell.imageSrc) return state;
      const targetColId =
        state.inbox.activeCollectionId === "all-images"
          ? state.inbox.collections[0].id
          : state.inbox.activeCollectionId;
      const newItem = {
        id: `inbox-moved-${Date.now()}`,
        imageSrc: cell.imageSrc,
        createdAt: Date.now(),
      };
      const newCells = [...currentRank.cells];
      newCells[index] = {
        ...newCells[index],
        imageSrc: null,
        textLabel: undefined,
        rating: undefined,
      };
      return {
        inbox: {
          ...state.inbox,
          collections: state.inbox.collections.map((c) =>
            c.id === targetColId ? { ...c, items: [...c.items, newItem] } : c
          ),
        },
        ranks: {
          ...state.ranks,
          [state.activeRankId]: {
            ...currentRank,
            cells: newCells,
            updatedAt: Date.now(),
          },
        },
      };
    }),
  handleUpdateTierRows: (rows) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (!current) return state;
      return {
        ranks: {
          ...state.ranks,
          [state.activeRankId]: {
            ...current,
            tierRows: rows,
            updatedAt: Date.now(),
          },
        },
      };
    }),
  handleTierItemRemove: (rowId, itemId) =>
    set((state) => {
      const activeRank = state.ranks[state.activeRankId];
      if (!activeRank) return state;
      const row = activeRank.tierRows.find((r) => r.id === rowId);
      if (!row) return state;

      const item = row.items.find((i) => i.id === itemId);
      let newInbox = state.inbox;

      if (item && item.imageSrc) {
        const targetColId =
          state.inbox.activeCollectionId === "all-images"
            ? state.inbox.collections[0].id
            : state.inbox.activeCollectionId;
        const rescued = checkAndRescueImages([item], state, targetColId);
        if (rescued.length > 0) {
          newInbox = {
            ...state.inbox,
            collections: state.inbox.collections.map((c) =>
              c.id === targetColId
                ? { ...c, items: [...c.items, ...rescued] }
                : c
            ),
          };
        }
      }

      const newRows = activeRank.tierRows.map((r) =>
        r.id === rowId ? { ...r, items: r.items.filter((i) => i.id !== itemId) } : r
      );
      return {
        inbox: newInbox,
        ranks: {
          ...state.ranks,
          [state.activeRankId]: {
            ...activeRank,
            tierRows: newRows,
            updatedAt: Date.now(),
          },
        },
      };
    }),
  recallItemByImageSrc: (imageSrc) => {
    set((s) => {
      const currentRank = s.ranks[s.activeRankId];
      if (!currentRank) return s;

      const newCells = currentRank.cells.map((c) =>
        c.imageSrc === imageSrc ? { ...c, imageSrc: null as any } : c // null vs undefined fix
      );

      const newTierRows = currentRank.tierRows.map((r) => ({
        ...r,
        items: r.items.filter((i) => i.imageSrc !== imageSrc),
      }));

      return {
        ranks: {
          ...s.ranks,
          [s.activeRankId]: {
            ...currentRank,
            cells: newCells,
            tierRows: newTierRows,
            updatedAt: Date.now(),
          },
        },
      };
    });
  },
  handleTierMoveToInbox: (rowId, itemIndex) =>
    set((state) => {
      const activeRank = state.ranks[state.activeRankId];
      if (!activeRank) return state;
      const row = activeRank.tierRows.find((r) => r.id === rowId);
      if (!row) return state;
      const item = row.items[itemIndex];

      let newInbox = state.inbox;
      if (item && item.imageSrc) {
        const targetColId =
          state.inbox.activeCollectionId === "all-images"
            ? state.inbox.collections[0].id
            : state.inbox.activeCollectionId;
        const rescued = checkAndRescueImages([item], state, targetColId);
        if (rescued.length > 0) {
          newInbox = {
            ...state.inbox,
            collections: state.inbox.collections.map((c) =>
              c.id === targetColId
                ? { ...c, items: [...c.items, ...rescued] }
                : c
            ),
          };
        }
      }
      const newRows = activeRank.tierRows.map((r) =>
        r.id === rowId
          ? { ...r, items: r.items.filter((i) => i.id !== item.id) }
          : r
      );

      return {
        inbox: newInbox,
        ranks: {
          ...state.ranks,
          [state.activeRankId]: {
            ...activeRank,
            tierRows: newRows,
            updatedAt: Date.now(),
          },
        },
      };
    }),
  handleInboxDropToTier: (itemId, collectionId, rowId, targetIndex) => {
    const state = get();
    const activeRank = state.ranks[state.activeRankId];
    if (!activeRank) return;

    let item: InboxItem | undefined;
    const collections = state.inbox.collections;
    if (collectionId === "all" || collectionId === "all-images") {
      for (const col of collections) {
        item = col.items.find((i) => i.id === itemId);
        if (item) break;
      }
    } else {
      item = collections
        .find((c) => c.id === collectionId)
        ?.items.find((i) => i.id === itemId);
    }

    if (!item) return;

    get().checkDuplicateAndProceed(item.imageSrc, () => {
      set((s) => {
        const currentRank = s.ranks[s.activeRankId];
        if (!currentRank) return s;
        const newCellData: CellData = {
          id: `tier-cell-${Date.now()}`,
          imageSrc: item!.imageSrc,
          position: 0,
        };
        const newRows = currentRank.tierRows.map((r) => {
          if (r.id === rowId) {
            const newItems = [...r.items];
            const insertIdx = targetIndex === -1 ? newItems.length : targetIndex;
            newItems.splice(insertIdx, 0, newCellData);
            return { ...r, items: newItems };
          }
          return r;
        });
        return {
          ranks: {
            ...s.ranks,
            [s.activeRankId]: {
              ...currentRank,
              tierRows: newRows,
              updatedAt: Date.now(),
            },
          },
        };
      });
    });
  },
  handleSearchDropToTier: (imageSrc, rowId, targetIndex) => {
    get().checkDuplicateAndProceed(imageSrc, () => {
      set((s) => {
        const currentRank = s.ranks[s.activeRankId];
        if (!currentRank) return s;
        const newCellData: CellData = {
          id: `tier-cell-${Date.now()}`,
          imageSrc: imageSrc,
          position: 0,
        };
        const newRows = currentRank.tierRows.map((r) => {
          if (r.id === rowId) {
            const newItems = [...r.items];
            const insertIdx = targetIndex === -1 ? newItems.length : targetIndex;
            newItems.splice(insertIdx, 0, newCellData);
            return { ...r, items: newItems };
          }
          return r;
        });

        const targetColId =
          s.inbox.activeCollectionId === "all-images"
            ? s.inbox.collections[0].id
            : s.inbox.activeCollectionId;
        const newItem: InboxItem = {
          id: `inbox-add-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          imageSrc,
          createdAt: Date.now(),
        };

        return {
          inbox: {
            ...s.inbox,
            collections: s.inbox.collections.map((c) =>
              c.id === targetColId ? { ...c, items: [...c.items, newItem] } : c
            ),
          },
          ranks: {
            ...s.ranks,
            [s.activeRankId]: {
              ...currentRank,
              tierRows: newRows,
              updatedAt: Date.now(),
            },
          },
        };
      });
    });
  },
  handleInboxDropToTierMulti: (itemIds, collectionId, rowId, targetIndex) => {
    const state = get();
    const activeRank = state.ranks[state.activeRankId];
    if (!activeRank) return;

    const collections = state.inbox.collections;
    const itemsToDrop: InboxItem[] = [];

    for (const itemId of itemIds) {
      let item: InboxItem | undefined;
      if (collectionId === "all" || collectionId === "all-images") {
        for (const col of collections) {
          item = col.items.find((i) => i.id === itemId);
          if (item) break;
        }
      } else {
        item = collections
          .find((c) => c.id === collectionId)
          ?.items.find((i) => i.id === itemId);
      }
      if (item) itemsToDrop.push(item);
    }

    if (itemsToDrop.length === 0) return;

    if (itemsToDrop.length === 1) {
      get().handleInboxDropToTier(itemsToDrop[0].id, collectionId, rowId, targetIndex);
      return;
    }

    set((s) => {
      const currentRank = s.ranks[s.activeRankId];
      if (!currentRank) return s;

      const validItemsToDrop = [];
      for (const item of itemsToDrop) {
        if (!s.preferences.skipDuplicateWarning) {
          const isDuplicate = currentRank.tierRows.some((row) =>
            row.items.some((i) => i.imageSrc === item.imageSrc)
          );
          if (isDuplicate) continue;
        }
        validItemsToDrop.push(item);
      }

      if (validItemsToDrop.length === 0) return s;

      const newRows = currentRank.tierRows.map((row) => {
        if (row.id === rowId) {
          const newItems = [...row.items];
          const itemsToAdd = validItemsToDrop.map((item) => ({
            id: `cell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            imageSrc: item.imageSrc,
            position: 0,
          }));

          if (targetIndex === -1 || targetIndex >= newItems.length) {
            newItems.push(...itemsToAdd);
          } else {
            newItems.splice(targetIndex, 0, ...itemsToAdd);
          }
          return { ...row, items: newItems };
        }
        return row;
      });

      return {
        ranks: {
          ...s.ranks,
          [s.activeRankId]: {
            ...currentRank,
            tierRows: newRows,
            updatedAt: Date.now(),
          },
        },
      };
    });
  },
  handleInternalTierMove: (sourceRowId, sourceItemId, targetRowId, targetIndex) =>
    set((state) => {
      const activeRank = state.ranks[state.activeRankId];
      if (!activeRank) return state;
      const newRows = [...activeRank.tierRows];
      const sRowIdx = newRows.findIndex((r) => r.id === sourceRowId);
      const tRowIdx = newRows.findIndex((r) => r.id === targetRowId);
      if (sRowIdx === -1 || tRowIdx === -1) return state;
      const sRow = { ...newRows[sRowIdx], items: [...newRows[sRowIdx].items] };
      const itemIdx = sRow.items.findIndex((i) => i.id === sourceItemId);
      if (itemIdx === -1) return state;
      const [movedItem] = sRow.items.splice(itemIdx, 1);
      newRows[sRowIdx] = sRow;
      if (sourceRowId === targetRowId) {
        let adjTarget = targetIndex;
        if (targetIndex !== -1 && itemIdx < targetIndex) {
          adjTarget -= 1;
        }
        if (adjTarget === -1 || adjTarget >= sRow.items.length) {
          sRow.items.push(movedItem);
        } else {
          sRow.items.splice(adjTarget, 0, movedItem);
        }
      } else {
        const tRow = { ...newRows[tRowIdx], items: [...newRows[tRowIdx].items] };
        if (targetIndex === -1 || targetIndex >= tRow.items.length) {
          tRow.items.push(movedItem);
        } else {
          tRow.items.splice(targetIndex, 0, movedItem);
        }
        newRows[tRowIdx] = tRow;
      }
      return {
        ranks: {
          ...state.ranks,
          [state.activeRankId]: {
            ...activeRank,
            tierRows: newRows,
            updatedAt: Date.now(),
          },
        },
      };
    }),
  handleNewRank: (type) =>
    set((state) => {
      const newRank = createBlankRank(type);
      return {
        activeRankId: newRank.id,
        ranks: { ...state.ranks, [newRank.id]: newRank as any },
      };
    }),
  handleDeleteRank: (id) =>
    set((state) => {
      const newRanks = { ...state.ranks };
      delete newRanks[id];
      const remainingIds = Object.keys(newRanks);
      if (remainingIds.length === 0) {
        const newRank = createBlankRank("ranking");
        return {
          activeRankId: newRank.id,
          ranks: { [newRank.id]: newRank as any },
        };
      }
      return {
        activeRankId: state.activeRankId === id ? remainingIds[0] : state.activeRankId,
        ranks: newRanks,
      };
    }),
  setActiveRankId: (id) => set({ activeRankId: id }),
});
