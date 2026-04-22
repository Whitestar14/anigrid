import { create } from "zustand";
import { persist, StateStorage, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import { get, set, del } from "idb-keyval";
import {
  GlobalState,
  Rank,
  InboxCollection,
  GlobalTheme,
  RankMode,
  InteractionState,
  TierRow,
  ProjectType,
  GridConfig,
  CellData,
  InboxItem,
} from "@/types";
import { migrateState } from "@/utils/storage";

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

export interface AppState extends GlobalState {
  interactionState: InteractionState;
  duplicateModalConfig: {
    isOpen: boolean;
    imageSrc: string | null;
    actionToExecute: (() => void) | null;
  };

  // State Setters
  setInteractionState: (state: InteractionState) => void;
  setDuplicateModalConfig: (
    config: Partial<AppState["duplicateModalConfig"]>
  ) => void;
  handleDuplicateConfirm: (dontAskAgain: boolean) => void;
  checkDuplicateAndProceed: (imageSrc: string, action: () => void) => void;
  updateActiveRank: (updates: Partial<Rank>) => void;
  updateRankById: (id: string, updates: Partial<Rank>) => void;
  updateActiveCollection: (updates: Partial<InboxCollection>) => void;
  updateGlobalTheme: (themeUpdates: Partial<GlobalTheme>) => void;

  // Grid / List Actions
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

  // Tier List Actions
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

  // Inbox / Search Actions
  handleInboxDrop: (
    itemId: string,
    sourceColId: string,
    toIndex: number
  ) => void;
  handleInboxDropMulti: (
    itemIds: string[],
    sourceColId: string,
    toIndex: number
  ) => void;
  handleSearchDrop: (imageSrc: string, toIndex: number) => void;
  handleAddToCollection: (imageSrc: string, collectionId: string) => void;
  handleUpdateLastTarget: (colId: string) => void;
  setIsDraggingFromDock: (v: boolean) => void;
  handleRestoreItem: (item: InboxItem, collectionId: string) => void;
  handleInboxUpload: (dataUrl: string) => void;
  switchCollection: (id: string) => void;
  addCollection: () => void;
  deleteCollection: (id: string) => void;
  renameCollection: (id: string, name: string) => void;
  removeInboxItem: (id: string) => void;

  // Global Actions
  handleClearAll: () => void;
  handleNewRank: (type: ProjectType) => void;
  handleDeleteRank: (id: string) => void;
  setActiveRankId: (id: string) => void;
  importState: (newState: GlobalState) => void;
  setSkipDuplicateWarning: (skip: boolean) => void;
  updatePreferences: (p: Partial<GlobalState["preferences"]>) => void;
}

const checkAndRescueImages = (
  removedCells: (CellData | InboxItem)[],
  currentState: GlobalState,
  _collectionToAddToId: string
) => {
  const allKnownImages = new Set<string>();
  currentState.inbox.collections.forEach((col) =>
    col.items.forEach((item) => allKnownImages.add(item.imageSrc))
  );
  const rescueItems: InboxItem[] = [];
  removedCells.forEach((cell, idx) => {
    if (cell.imageSrc && !allKnownImages.has(cell.imageSrc)) {
      rescueItems.push({
        id: `rescued-${Date.now()}-${idx}`,
        imageSrc: cell.imageSrc,
        createdAt: Date.now(),
      });
    }
  });
  return rescueItems;
};

const defaultState: GlobalState = {
  version: 2,
  activeRankId: "default",
  theme: { accentColor: "#0a84ff", paletteId: "ios-dark", isDark: true },
  ranks: {
    default: {
      id: "default",
      title: "My Ranking",
      type: "ranking",
      mode: "grid",
      config: { rows: 3, cols: 3 },
      cells: Array.from({ length: 9 }).map((_, i) => ({
        id: `cell-${i}`,
        imageSrc: null,
        position: i,
      })),
      style: "seamless",
      showNumbers: true,
      showTitle: true,
      showDate: true,
      gap: 0,
      backgroundColor: "transparent",
      tierRows: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  },
  inbox: {
    collections: [{ id: "default-inbox", name: "Inbox", items: [] }],
    activeCollectionId: "default-inbox",
    isDraggingFromDock: false,
  },
  preferences: {
    skipDuplicateWarning: false,
    reduceGlassEffects: false,
    autoCloseDockOnDragDesktop: true,
  },
};

export const useStore = create<AppState>()(
  temporal(
    persist(
      (set, get) => ({
        ...defaultState,
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

        updateActiveRank: (updates) =>
          set((state) => {
            const activeRank = state.ranks[state.activeRankId];
            if (!activeRank) return state;
            return {
              ranks: {
                ...state.ranks,
                [state.activeRankId]: {
                  ...activeRank,
                  ...updates,
                  updatedAt: Date.now(),
                },
              },
            };
          }),

        updateRankById: (id, updates) =>
          set((state) => {
            const rank = state.ranks[id];
            if (!rank) return state;
            return {
              ranks: {
                ...state.ranks,
                [id]: { ...rank, ...updates, updatedAt: Date.now() },
              },
            };
          }),

        updateActiveCollection: (updates) =>
          set((state) => {
            return {
              inbox: {
                ...state.inbox,
                collections: state.inbox.collections.map((c) =>
                  c.id === state.inbox.activeCollectionId
                    ? { ...c, ...updates }
                    : c
                ),
              },
            };
          }),

        updateGlobalTheme: (themeUpdates) =>
          set((state) => ({
            theme: { ...state.theme!, ...themeUpdates },
          })),

        handleConfigChange: (newConfig) =>
          set((state) => {
            const activeRank = state.ranks[state.activeRankId];
            if (!activeRank) return state;

            const isList = activeRank.mode === "list";
            const oldTotal = activeRank.cells.length;
            const newTotal = isList
              ? newConfig.rows
              : newConfig.rows * newConfig.cols;

            let nextCells = [...activeRank.cells];
            const targetColId =
              state.inbox.activeCollectionId === "all-images"
                ? state.inbox.collections[0].id
                : state.inbox.activeCollectionId;

            if (newTotal > oldTotal) {
              for (let i = oldTotal; i < newTotal; i++) {
                nextCells.push({
                  id: `cell-${Date.now()}-${i}`,
                  imageSrc: null,
                  position: i,
                });
              }
              return {
                ranks: {
                  ...state.ranks,
                  [state.activeRankId]: {
                    ...activeRank,
                    config: newConfig,
                    cells: nextCells,
                    updatedAt: Date.now(),
                  },
                },
              };
            } else if (newTotal < oldTotal) {
              const removed = nextCells.slice(newTotal);
              const rescuedItems = checkAndRescueImages(
                removed,
                state,
                targetColId
              );
              nextCells = nextCells.slice(0, newTotal);

              let newInbox = state.inbox;
              if (rescuedItems.length > 0) {
                newInbox = {
                  ...state.inbox,
                  collections: state.inbox.collections.map((c) =>
                    c.id === targetColId
                      ? { ...c, items: [...c.items, ...rescuedItems] }
                      : c
                  ),
                };
              }

              return {
                inbox: newInbox,
                ranks: {
                  ...state.ranks,
                  [state.activeRankId]: {
                    ...activeRank,
                    config: newConfig,
                    cells: nextCells,
                    updatedAt: Date.now(),
                  },
                },
              };
            }

            return {
              ranks: {
                ...state.ranks,
                [state.activeRankId]: {
                  ...activeRank,
                  config: newConfig,
                  updatedAt: Date.now(),
                },
              },
            };
          }),

        handleModeChange: (newMode) =>
          set((state) => {
            const activeRank = state.ranks[state.activeRankId];
            if (!activeRank) return state;

            let newConfig = { ...activeRank.config };
            const currentCellCount = activeRank.cells.length;

            if (activeRank.mode === "grid" && newMode === "list") {
              newConfig.rows = currentCellCount;
            } else if (activeRank.mode === "list" && newMode === "grid") {
              const cols = activeRank.config.cols || 3;
              const rowsNeeded = Math.ceil(currentCellCount / cols);
              newConfig.rows = Math.max(1, rowsNeeded);
            }

            return {
              ranks: {
                ...state.ranks,
                [state.activeRankId]: {
                  ...activeRank,
                  mode: newMode,
                  config: newConfig,
                  updatedAt: Date.now(),
                },
              },
            };
          }),

        handleVisualToggle: (key) =>
          set((state) => {
            const activeRank = state.ranks[state.activeRankId];
            if (!activeRank) return state;
            return {
              ranks: {
                ...state.ranks,
                [state.activeRankId]: {
                  ...activeRank,
                  [key]: !activeRank[key],
                  updatedAt: Date.now(),
                },
              },
            };
          }),

        handleCellUpload: (index, dataUrl) =>
          set((state) => {
            const activeRank = state.ranks[state.activeRankId];
            if (!activeRank) return state;
            const newCells = activeRank.cells.map((cell, i) =>
              i === index ? { ...cell, imageSrc: dataUrl } : cell
            );
            return {
              ranks: {
                ...state.ranks,
                [state.activeRankId]: {
                  ...activeRank,
                  cells: newCells,
                  updatedAt: Date.now(),
                },
              },
            };
          }),

        handleUpdateCell: (index, data) =>
          set((state) => {
            const activeRank = state.ranks[state.activeRankId];
            if (!activeRank) return state;
            const newCells = activeRank.cells.map((cell, i) =>
              i === index ? { ...cell, ...data } : cell
            );
            return {
              ranks: {
                ...state.ranks,
                [state.activeRankId]: {
                  ...activeRank,
                  cells: newCells,
                  updatedAt: Date.now(),
                },
              },
            };
          }),

        handleCellClear: (index) =>
          set((state) => {
            const activeRank = state.ranks[state.activeRankId];
            if (!activeRank) return state;
            const cell = activeRank.cells[index];
            const targetColId =
              state.inbox.activeCollectionId === "all-images"
                ? state.inbox.collections[0].id
                : state.inbox.activeCollectionId;

            let newInbox = state.inbox;
            if (cell.imageSrc) {
              const rescued = checkAndRescueImages([cell], state, targetColId);
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
            const newCells = activeRank.cells.map((c, i) =>
              i === index
                ? {
                    ...c,
                    imageSrc: null,
                    textLabel: undefined,
                    rating: undefined,
                  }
                : c
            );
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
          }),

        handleSwapCells: (fromIndex, toIndex) =>
          set((state) => {
            const activeRank = state.ranks[state.activeRankId];
            if (!activeRank) return state;
            const newCells = [...activeRank.cells];
            const temp = { ...newCells[fromIndex] };
            newCells[fromIndex] = {
              ...newCells[toIndex],
              id: newCells[fromIndex].id,
              position: fromIndex,
            };
            newCells[toIndex] = {
              ...temp,
              id: newCells[toIndex].id,
              position: toIndex,
            };
            return {
              ranks: {
                ...state.ranks,
                [state.activeRankId]: {
                  ...activeRank,
                  cells: newCells,
                  updatedAt: Date.now(),
                },
              },
            };
          }),

        handleMoveToInbox: (index) =>
          set((state) => {
            const activeRank = state.ranks[state.activeRankId];
            if (!activeRank) return state;
            const cell = activeRank.cells[index];
            const targetColId =
              state.inbox.activeCollectionId === "all-images"
                ? state.inbox.collections[0].id
                : state.inbox.activeCollectionId;

            if (cell.imageSrc) {
              const newItem: InboxItem = {
                id: `inbox-${Date.now()}`,
                imageSrc: cell.imageSrc,
                createdAt: Date.now(),
              };
              const newCells = activeRank.cells.map((c, i) =>
                i === index
                  ? {
                      ...c,
                      imageSrc: null,
                      textLabel: undefined,
                      rating: undefined,
                    }
                  : c
              );

              return {
                inbox: {
                  ...state.inbox,
                  collections: state.inbox.collections.map((c) =>
                    c.id === targetColId
                      ? { ...c, items: [...c.items, newItem] }
                      : c
                  ),
                },
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
            return state;
          }),

        handleUpdateTierRows: (rows) =>
          set((state) => {
            const activeRank = state.ranks[state.activeRankId];
            if (!activeRank) return state;
            return {
              ranks: {
                ...state.ranks,
                [state.activeRankId]: {
                  ...activeRank,
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
              r.id === rowId
                ? { ...r, items: r.items.filter((i) => i.id !== itemId) }
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

        recallItemByImageSrc: (imageSrc: string) => {
          set((s) => {
            const currentRank = s.ranks[s.activeRankId];
            if (!currentRank) return s;

            // Clear in grid cells
            const newCells = currentRank.cells.map((c) =>
              c.imageSrc === imageSrc ? { ...c, imageSrc: undefined } : c
            );

            // Clear in tier rows
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
                  const insertIdx =
                    targetIndex === -1 ? newItems.length : targetIndex;
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
                  const insertIdx =
                    targetIndex === -1 ? newItems.length : targetIndex;
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
                id: `inbox-add-${Date.now()}-${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
                imageSrc,
                createdAt: Date.now(),
              };

              return {
                inbox: {
                  ...s.inbox,
                  collections: s.inbox.collections.map((c) =>
                    c.id === targetColId
                      ? { ...c, items: [...c.items, newItem] }
                      : c
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

        handleInternalTierMove: (
          sourceRowId,
          sourceItemId,
          targetRowId,
          targetIndex
        ) =>
          set((state) => {
            const activeRank = state.ranks[state.activeRankId];
            if (!activeRank) return state;

            let itemToMove: CellData | undefined;
            let newRows = activeRank.tierRows.map((r) => {
              if (r.id === sourceRowId) {
                itemToMove = r.items.find((i) => i.id === sourceItemId);
                return {
                  ...r,
                  items: r.items.filter((i) => i.id !== sourceItemId),
                };
              }
              return r;
            });

            if (!itemToMove) return state;

            newRows = newRows.map((r) => {
              if (r.id === targetRowId) {
                const newItems = [...r.items];

                if (sourceRowId === targetRowId) {
                  const originalItems = activeRank.tierRows.find(
                    (ro) => ro.id === sourceRowId
                  )!.items;
                  const srcIdx = originalItems.findIndex(
                    (i) => i.id === sourceItemId
                  );
                  const movingItem = originalItems[srcIdx];
                  const itemsWithout = originalItems.filter(
                    (i) => i.id !== sourceItemId
                  );

                  let realTarget =
                    targetIndex === -1 ? itemsWithout.length : targetIndex;
                  if (targetIndex !== -1 && srcIdx < targetIndex)
                    realTarget -= 1;

                  const finalItems = [...itemsWithout];
                  finalItems.splice(realTarget, 0, movingItem);
                  return { ...r, items: finalItems };
                } else {
                  const insertIdx =
                    targetIndex === -1 ? newItems.length : targetIndex;
                  newItems.splice(insertIdx, 0, itemToMove!);
                  return { ...r, items: newItems };
                }
              }
              return r;
            });

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

        handleInboxDropMulti: (itemIds, sourceColId, toIndex) => {
          const state = get();
          const activeRank = state.ranks[state.activeRankId];
          if (!activeRank) return;

          const collections = state.inbox.collections;
          const itemsToDrop: InboxItem[] = [];

          for (const itemId of itemIds) {
            let item: InboxItem | undefined;
            if (sourceColId === "all" || sourceColId === "all-images") {
              for (const col of collections) {
                item = col.items.find((i) => i.id === itemId);
                if (item) break;
              }
            } else {
              item = collections
                .find((c) => c.id === sourceColId)
                ?.items.find((i) => i.id === itemId);
            }
            if (item) itemsToDrop.push(item);
          }

          if (itemsToDrop.length === 0) return;

          if (itemsToDrop.length === 1) {
            // Single item drop: replace the cell and show duplicate warning if needed
            get().handleInboxDrop(itemsToDrop[0].id, sourceColId, toIndex);
            return;
          }

          set((s) => {
            const currentRank = s.ranks[s.activeRankId];
            if (!currentRank) return s;
            const newCells = [...currentRank.cells];

            let currentDropIndex = toIndex;
            for (const item of itemsToDrop) {
              // Check for duplicate
              if (!s.preferences.skipDuplicateWarning) {
                const isDuplicate = newCells.some(
                  (c) => c.imageSrc === item.imageSrc
                );
                if (isDuplicate) continue; // Skip duplicates in multi-drop for simplicity
              }

              // Find next available empty cell starting from currentDropIndex
              while (
                currentDropIndex < newCells.length &&
                newCells[currentDropIndex].imageSrc
              ) {
                currentDropIndex++;
              }
              if (currentDropIndex < newCells.length) {
                newCells[currentDropIndex] = {
                  ...newCells[currentDropIndex],
                  imageSrc: item.imageSrc,
                };
                currentDropIndex++; // Increment so next item goes to next cell
              } else {
                break;
              }
            }

            return {
              ranks: {
                ...s.ranks,
                [s.activeRankId]: {
                  ...currentRank,
                  cells: newCells,
                  updatedAt: Date.now(),
                },
              },
            };
          });
        },

        handleInboxDropToTierMulti: (
          itemIds,
          collectionId,
          rowId,
          targetIndex
        ) => {
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
            get().handleInboxDropToTier(
              itemsToDrop[0].id,
              collectionId,
              rowId,
              targetIndex
            );
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
                  id: `cell-${Date.now()}-${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
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

        handleInboxDrop: (itemId, sourceColId, toIndex) => {
          const state = get();
          const activeRank = state.ranks[state.activeRankId];
          if (!activeRank) return;

          let item: InboxItem | undefined;
          const collections = state.inbox.collections;
          if (sourceColId === "all" || sourceColId === "all-images") {
            for (const col of collections) {
              item = col.items.find((i) => i.id === itemId);
              if (item) break;
            }
          } else {
            item = collections
              .find((c) => c.id === sourceColId)
              ?.items.find((i) => i.id === itemId);
          }

          if (!item) return;

          get().checkDuplicateAndProceed(item.imageSrc, () => {
            set((s) => {
              const currentRank = s.ranks[s.activeRankId];
              if (!currentRank) return s;
              const newCells = [...currentRank.cells];
              newCells[toIndex] = {
                ...newCells[toIndex],
                imageSrc: item!.imageSrc,
              };
              return {
                ranks: {
                  ...s.ranks,
                  [s.activeRankId]: {
                    ...currentRank,
                    cells: newCells,
                    updatedAt: Date.now(),
                  },
                },
              };
            });
          });
        },

        handleSearchDrop: (imageSrc, toIndex) => {
          get().checkDuplicateAndProceed(imageSrc, () => {
            set((s) => {
              const currentRank = s.ranks[s.activeRankId];
              if (!currentRank) return s;

              const newItem: InboxItem = {
                id: `inbox-search-${Date.now()}`,
                imageSrc,
                createdAt: Date.now(),
              };
              const targetColId =
                s.inbox.activeCollectionId === "all-images"
                  ? s.inbox.collections[0].id
                  : s.inbox.activeCollectionId;

              const newCells = [...currentRank.cells];
              newCells[toIndex] = { ...newCells[toIndex], imageSrc };

              return {
                inbox: {
                  ...s.inbox,
                  collections: s.inbox.collections.map((c) =>
                    c.id === targetColId
                      ? { ...c, items: [...c.items, newItem] }
                      : c
                  ),
                },
                ranks: {
                  ...s.ranks,
                  [s.activeRankId]: {
                    ...currentRank,
                    cells: newCells,
                    updatedAt: Date.now(),
                  },
                },
              };
            });
          });
        },

        handleAddToCollection: (imageSrc, collectionId) =>
          set((state) => {
            const newItem: InboxItem = {
              id: `inbox-add-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`,
              imageSrc,
              createdAt: Date.now(),
            };
            return {
              inbox: {
                ...state.inbox,
                collections: state.inbox.collections.map((c) =>
                  c.id === collectionId
                    ? { ...c, items: [...c.items, newItem] }
                    : c
                ),
              },
            };
          }),

        setIsDraggingFromDock: (v) =>
          set((s) => ({
            inbox: { ...s.inbox, isDraggingFromDock: v },
          })),

        handleUpdateLastTarget: (colId) =>
          set((state) => ({
            inbox: { ...state.inbox, lastTargetCollectionId: colId },
          })),

        handleRestoreItem: (item, collectionId) =>
          set((state) => {
            const targetId = state.inbox.collections.find(
              (c) => c.id === collectionId
            )
              ? collectionId
              : state.inbox.collections[0].id;
            return {
              inbox: {
                ...state.inbox,
                collections: state.inbox.collections.map((c) =>
                  c.id === targetId ? { ...c, items: [...c.items, item] } : c
                ),
              },
            };
          }),

        handleInboxUpload: (dataUrl) =>
          set((state) => {
            const activeColId =
              state.inbox.activeCollectionId === "all-images"
                ? state.inbox.collections[0].id
                : state.inbox.activeCollectionId;
            const newItem: InboxItem = {
              id: `inbox-${Date.now()}`,
              imageSrc: dataUrl,
              createdAt: Date.now(),
            };
            return {
              inbox: {
                ...state.inbox,
                collections: state.inbox.collections.map((c) =>
                  c.id === activeColId
                    ? { ...c, items: [...c.items, newItem] }
                    : c
                ),
              },
            };
          }),

        switchCollection: (id) =>
          set((state) => ({
            inbox: { ...state.inbox, activeCollectionId: id },
          })),

        addCollection: () =>
          set((state) => {
            const newId = `col-${Date.now()}`;
            return {
              inbox: {
                ...state.inbox,
                activeCollectionId: newId,
                collections: [
                  ...state.inbox.collections,
                  { id: newId, name: "New Collection", items: [] },
                ],
              },
            };
          }),

        deleteCollection: (id) =>
          set((state) => {
            const newCols = state.inbox.collections.filter((c) => c.id !== id);
            return {
              inbox: {
                ...state.inbox,
                collections: newCols,
                activeCollectionId:
                  state.inbox.activeCollectionId === id
                    ? newCols[0].id
                    : state.inbox.activeCollectionId,
              },
            };
          }),

        renameCollection: (id, name) =>
          set((state) => ({
            inbox: {
              ...state.inbox,
              collections: state.inbox.collections.map((c) =>
                c.id === id ? { ...c, name } : c
              ),
            },
          })),

        removeInboxItem: (id) =>
          set((state) => {
            const activeColId = state.inbox.activeCollectionId;
            return {
              inbox: {
                ...state.inbox,
                collections: state.inbox.collections.map((c) =>
                  c.id === activeColId
                    ? { ...c, items: c.items.filter((i) => i.id !== id) }
                    : c
                ),
              },
            };
          }),

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
              const allItems: CellData[] = activeRank.tierRows.flatMap(
                (r) => r.items
              );
              const rescued = checkAndRescueImages(
                allItems,
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

        handleNewRank: (type) =>
          set((state) => {
            const newId = `rank-${Date.now()}`;
            const newRank: Rank = {
              id: newId,
              title: type === "tierlist" ? "My Tier List" : "My Ranking",
              type: type,
              mode: type === "tierlist" ? "tier" : "grid",
              config: { rows: 3, cols: 3 },
              cells: Array.from({ length: 9 }).map((_, i) => ({
                id: `cell-${i}`,
                imageSrc: null,
                position: i,
              })),
              style: "seamless",
              showNumbers: true,
              showTitle: true,
              showDate: true,
              gap: 0,
              backgroundColor: "transparent",
              tierRows: [
                { id: "tier-s", label: "S", color: "#ff7f7f", items: [] },
                { id: "tier-a", label: "A", color: "#ffbf7f", items: [] },
                { id: "tier-b", label: "B", color: "#ffdf7f", items: [] },
                { id: "tier-c", label: "C", color: "#ffff7f", items: [] },
                { id: "tier-d", label: "D", color: "#bfff7f", items: [] },
                { id: "tier-f", label: "F", color: "#7fffff", items: [] },
              ],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            return {
              activeRankId: newId,
              ranks: { ...state.ranks, [newId]: newRank },
            };
          }),

        setActiveRankId: (id) => set({ activeRankId: id }),

        handleDeleteRank: (id) =>
          set((state) => {
            const newRanks = { ...state.ranks };
            delete newRanks[id];
            const remainingIds = Object.keys(newRanks);

            if (remainingIds.length === 0) {
              const newId = `rank-${Date.now()}`;
              return {
                activeRankId: newId,
                ranks: {
                  [newId]: {
                    id: newId,
                    title: "My Ranking",
                    type: "ranking",
                    mode: "grid",
                    config: { rows: 3, cols: 3 },
                    cells: Array.from({ length: 9 }).map((_, i) => ({
                      id: `cell-${i}`,
                      imageSrc: null,
                      position: i,
                    })),
                    style: "seamless",
                    showNumbers: true,
                    showTitle: true,
                    showDate: true,
                    gap: 0,
                    backgroundColor: "transparent",
                    tierRows: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  },
                },
              };
            }

            return {
              activeRankId:
                state.activeRankId === id
                  ? remainingIds[0]
                  : state.activeRankId,
              ranks: newRanks,
            };
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
      }),
      {
        name: "anime-ranker-state",
        storage: createJSONStorage(() => idbStorage),
        version: 3,
        migrate: (persistedState: any, _version: number) => {
          return migrateState(persistedState) as AppState;
        },
      }
    ),
    {
      partialize: (state) => {
        const { _interactionState, _duplicateModalConfig, ...rest } = state;
        return rest;
      },
    }
  )
);
