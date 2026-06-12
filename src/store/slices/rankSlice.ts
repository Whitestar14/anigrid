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
      if (!current) return;

      const oldMode = current.mode;
      if (oldMode === newMode) return;

      current.mode = newMode;

      if (newMode === "list") {
        const totalItems = current.cells.length;
        current.config.rows = totalItems;
        if (totalItems > current.cells.length) {
          ensureCells(current.cells, totalItems - 1);
        } else if (totalItems < current.cells.length) {
          current.cells = current.cells.slice(0, totalItems);
        }
      } else {
        const totalItems = current.cells.length;
        const cols = current.config.cols || 5;
        const neededRows = Math.max(1, Math.ceil(totalItems / cols));
        current.config.rows = neededRows;

        const newTotalCells = neededRows * cols;
        if (newTotalCells > current.cells.length) {
          ensureCells(current.cells, newTotalCells - 1);
        } else if (newTotalCells < current.cells.length) {
          current.cells = current.cells.slice(0, newTotalCells);
        }
      }

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
  handleReorderCells: (fromIndex, toIndex) =>
    set((state) => {
      const current = state.ranks[state.activeRankId];
      if (current && fromIndex !== toIndex) {
        const [movedItem] = current.cells.splice(fromIndex, 1);
        current.cells.splice(toIndex, 0, movedItem);
        current.updatedAt = Date.now();
      }
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
