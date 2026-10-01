import { StateCreator } from "zustand";
import { AppState } from "../useStore";
import { TierRow, ProjectType, GridConfig, CellData } from "@/types";
import { ensureCells } from "@/utils/storeUtils";
import {
  createBlankRank,
  createRankLike,
  defaultBoardBackground,
} from "@/utils/storage";

export interface RankSlice {
  updateActiveRank: (updates: Partial<AppState["ranks"][string]>) => void;
  updateRankById: (id: string, updates: Partial<AppState["ranks"][string]>) => void;
  handleConfigChange: (newConfig: GridConfig) => void;

  handleVisualToggle: (
    key: "showNumbers" | "showTitle" | "showDate" | "showTiers" | "borderless"
  ) => void;
  handleCellUpload: (index: number, dataUrl: string) => void;
  handleUpdateCell: (index: number, data: Partial<CellData>) => void;
  handleCellClear: (index: number) => void;
  handleSwapCells: (fromIndex: number, toIndex: number) => void;
  handleReorderCells: (fromIndex: number, toIndex: number) => void;
  handleRecallFromBoard: (imageSrc: string) => void;
  handleUpdateTierItem: (rowId: string, itemId: string, data: Partial<CellData>) => void;
  handleUpdateTierRows: (rows: TierRow[]) => void;
  handleReorderTierRows: (fromIndex: number, toIndex: number) => void;
  handleTierItemRemove: (rowId: string, itemId: string) => void;

  handleNewRank: (type: ProjectType) => void;
  /** Blank project inheriting the active project's schema. Returns its id. */
  handleNewRankLikeCurrent: () => string | undefined;
  handleDeleteRank: (id: string) => void;
  setActiveRankId: (id: string) => void;
}

export const createRankSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
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

      const totalCells = current.type === "list" ? newConfig.rows : newConfig.rows * newConfig.cols;

      if (totalCells > current.cells.length) {
        ensureCells(current.cells, totalCells - 1);
      } else if (totalCells < current.cells.length) {
        current.cells = current.cells.slice(0, totalCells);
      }
      current.config = newConfig;
      current.updatedAt = Date.now();
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
  handleRecallFromBoard: (imageSrc) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (!current || !imageSrc) return;

      let cleared = false;

      current.cells.forEach((cell) => {
        if (cell.imageSrc !== imageSrc) return;
        cell.imageSrc = null;
        cell.textLabel = undefined;
        cell.rating = undefined;
        cell.zoom = undefined;
        cell.objectPosition = undefined;
        cleared = true;
      });

      current.tierRows.forEach((row) => {
        if (!row.items.some((i) => i.imageSrc === imageSrc)) return;
        row.items = row.items.filter((i) => i.imageSrc !== imageSrc);
        cleared = true;
      });

      if (!cleared) return;

      /* The point of a recall is that the image is still yours afterwards, so if
         it was never in the library (it arrived from a URL or a direct upload)
         it is filed into the stash now rather than evaporating. */
      const alreadyTracked = state.inbox.collections.some((c) =>
        c.items.some((i) => i.imageSrc === imageSrc)
      );
      if (!alreadyTracked) {
        const targetId =
          state.inbox.activeCollectionId === "all-images"
            ? state.inbox.lastTargetCollectionId ?? state.inbox.collections[0]?.id
            : state.inbox.activeCollectionId;
        const col = state.inbox.collections.find((c) => c.id === targetId);
        col?.items.unshift({
          id: `inbox-recalled-${Date.now()}`,
          imageSrc,
          createdAt: Date.now(),
        });
      }

      current.updatedAt = Date.now();
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
  handleUpdateTierItem: (rowId, itemId, data) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (current) {
        const row = current.tierRows.find(r => r.id === rowId);
        if (row) {
          const item = row.items.find(i => i.id === itemId);
          if (item) {
            Object.assign(item, data);
            current.updatedAt = Date.now();
          }
        }
      }
    }),
  handleUpdateTierRows: (rows) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (current) {
        current.tierRows = rows;
        current.updatedAt = Date.now();
      }
    }),
  handleReorderTierRows: (fromIndex, toIndex) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (!current) return;
      const rows = current.tierRows;
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= rows.length ||
        toIndex >= rows.length
      ) {
        return;
      }
      const [moved] = rows.splice(fromIndex, 1);
      rows.splice(toIndex, 0, moved);
      current.updatedAt = Date.now();
    }),
  handleTierItemRemove: (rowId, itemId) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (current) {
        const row = current.tierRows.find(r => r.id === rowId);
        if (row) {
          row.items = row.items.filter(i => i.id !== itemId);
          current.updatedAt = Date.now();
        }
      }
    }),

  handleNewRank: (type) =>
    set((state) => {
      // A new project is created *into* the current appearance, so a board made
      // in light mode does not open as a black rectangle.
      const newRank = createBlankRank(
        type,
        defaultBoardBackground(state.theme?.isDark ?? true)
      );
      state.activeRankId = newRank.id;
      state.ranks[newRank.id] = newRank as any;
    }),
  handleNewRankLikeCurrent: () => {
    const source = get().ranks[get().activeRankId];
    if (!source) return undefined;
    const newRank = createRankLike(source);
    set((state) => {
      state.activeRankId = newRank.id;
      state.ranks[newRank.id] = newRank as any;
    });
    return newRank.id;
  },

  handleDeleteRank: (id) =>
    set((state) => {
      delete state.ranks[id];
      const remainingIds = Object.keys(state.ranks);
      if (remainingIds.length === 0) {
        const newRank = createBlankRank(
          "ranking",
          defaultBoardBackground(state.theme?.isDark ?? true)
        );
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
