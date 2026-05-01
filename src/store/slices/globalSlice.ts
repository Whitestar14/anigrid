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
  [["zustand/temporal", unknown]],
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
    set((state) => ({
      duplicateModalConfig: { ...state.duplicateModalConfig, ...config },
    })),
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
      set({
        duplicateModalConfig: {
          isOpen: true,
          imageSrc,
          actionToExecute: action,
        },
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
    if (dontAskAgain) {
      set((s) => ({
        preferences: { ...s.preferences, skipDuplicateWarning: true },
      }));
    }
    set({
      duplicateModalConfig: {
        isOpen: false,
        imageSrc: null,
        actionToExecute: null,
      },
    });
  },

  updateGlobalTheme: (themeUpdates) =>
    set((state) => ({
      theme: { ...state.theme!, ...themeUpdates },
    })),

  handleClearAll: () =>
    set((state) => {
      const activeRank = state.ranks[state.activeRankId];
      if (!activeRank) return state;

      const targetColId =
        state.inbox.activeCollectionId === "all-images"
          ? state.inbox.collections[0].id
          : state.inbox.activeCollectionId;
      let newInbox = state.inbox;

      if (activeRank.type === "tierlist") {
        const allItems = activeRank.tierRows.flatMap((r) => r.items);
        const rescued = checkAndRescueImages(allItems, state, targetColId);
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
        const newRows = activeRank.tierRows.map((r) => ({
          ...r,
          items: [],
        }));
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
      } else {
        const cellsWithImages = activeRank.cells.filter(
          (c) => c.imageSrc
        );
        const rescued = checkAndRescueImages(
          cellsWithImages,
          state,
          targetColId
        );
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
        const newCells = activeRank.cells.map((c) => ({
          ...c,
          imageSrc: null,
          textLabel: undefined,
          rating: undefined,
        }));
        return {
          inbox: newInbox,
          ranks: {
            ...state.ranks,
            [state.activeRankId]: {
              ...activeRank,
              cells: newCells,
              updatedAt: Date.now(),
            },
          },
        };
      }
    }),

  importState: (newState) => set(() => newState),

  updatePreferences: (p) =>
    set((state) => ({
      preferences: { ...state.preferences, ...p },
    })),

  setSkipDuplicateWarning: (skip) =>
    set((state) => ({
      preferences: { ...state.preferences, skipDuplicateWarning: skip },
    })),
});
