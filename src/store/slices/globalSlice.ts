import { StateCreator } from "zustand";
import { AppState } from "../useStore";
import { checkAndRescueImages } from "@/utils/storeUtils";
import { GlobalState, InteractionState } from "@/types";

export interface GlobalSlice {
  interactionState: InteractionState;
  duplicateModalConfig: {
    isOpen: boolean;
    imageSrc: string | null;
    actionToExecute: (() => void) | null;
  };
  setInteractionState: (state: InteractionState) => void;
  setDuplicateModalConfig: (
    config: Partial<AppState["duplicateModalConfig"]>
  ) => void;
  handleDuplicateConfirm: (dontAskAgain: boolean) => void;
  checkDuplicateAndProceed: (imageSrc: string, action: () => void) => void;
  updateGlobalTheme: (themeUpdates: Partial<GlobalState["theme"]>) => void;
  handleClearAll: () => void;
  importState: (newState: GlobalState) => void;
  setSkipDuplicateWarning: (skip: boolean) => void;
  updatePreferences: (p: Partial<GlobalState["preferences"]>) => void;
}

export const createGlobalSlice: StateCreator<
  AppState,
  [["zustand/temporal", unknown], ["zustand/immer", never]],
  [],
  GlobalSlice
> = (set, get) => ({
  interactionState: null,
  duplicateModalConfig: {
    isOpen: false,
    imageSrc: null,
    actionToExecute: null,
  },
  setInteractionState: (state) => set({ interactionState: state }),
  setDuplicateModalConfig: (config) =>
    set((state) => {
      Object.assign(state.duplicateModalConfig, config);
    }),
  checkDuplicateAndProceed: (imageSrc, action) => {
    const state = get();
    const activeRank = state.ranks[state.activeRankId];
    if (!activeRank) return;

    if (state.preferences.skipDuplicateWarning) {
      action();
      return;
    }

    let isDuplicate = false;
    if (activeRank.type === "ranking") {
      isDuplicate = activeRank.cells.some((c) => c.imageSrc === imageSrc);
    } else if (activeRank.type === "tierlist") {
      isDuplicate = activeRank.tierRows.some((row) =>
        row.items.some((item) => item.imageSrc === imageSrc)
      );
    }

    if (isDuplicate) {
      set((draft) => {
        draft.duplicateModalConfig.isOpen = true;
        draft.duplicateModalConfig.imageSrc = imageSrc;
        draft.duplicateModalConfig.actionToExecute = action;
      });
    } else {
      action();
    }
  },

  handleDuplicateConfirm: (dontAskAgain) => {
    const state = get();
    if (state.duplicateModalConfig.actionToExecute) {
      state.duplicateModalConfig.actionToExecute();
    }
    
    set((draft) => {
      if (dontAskAgain) {
        draft.preferences.skipDuplicateWarning = true;
      }
      draft.duplicateModalConfig.isOpen = false;
      draft.duplicateModalConfig.imageSrc = null;
      draft.duplicateModalConfig.actionToExecute = null;
    });
  },

  updateGlobalTheme: (themeUpdates) =>
    set((state) => {
      if (state.theme) Object.assign(state.theme, themeUpdates);
    }),

  handleClearAll: () =>
    set((state) => {
      const activeRank = state.ranks[state.activeRankId];
      if (!activeRank) return;

      const targetColId =
        state.inbox.activeCollectionId === "all-images"
          ? state.inbox.collections[0].id
          : state.inbox.activeCollectionId;

      const col = state.inbox.collections.find((c) => c.id === targetColId);

      if (activeRank.type === "tierlist") {
        const allItems = activeRank.tierRows.flatMap((r) => r.items);
        const rescued = checkAndRescueImages(allItems, state, targetColId);
        if (col && rescued.length > 0) {
          col.items.push(...rescued);
        }
        activeRank.tierRows.forEach((r) => {
          r.items = [];
        });
      } else {
        const cellsWithImages = activeRank.cells.filter((c) => c.imageSrc);
        const rescued = checkAndRescueImages(cellsWithImages, state, targetColId);
        if (col && rescued.length > 0) {
          col.items.push(...rescued);
        }
        activeRank.cells.forEach((c) => {
          c.imageSrc = null;
          c.textLabel = undefined;
          c.rating = undefined;
        });
      }
      activeRank.updatedAt = Date.now();
    }),

  importState: (newState) => set(() => newState),

  updatePreferences: (p) =>
    set((state) => {
      Object.assign(state.preferences, p);
    }),

  setSkipDuplicateWarning: (skip) =>
    set((state) => {
      state.preferences.skipDuplicateWarning = skip;
    }),
});
