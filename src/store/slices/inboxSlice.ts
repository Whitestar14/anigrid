import { StateCreator } from "zustand";
import { AppState } from "../useStore";
import { InboxCollection, InboxItem } from "@/types";

export interface InboxSlice {
  updateActiveCollection: (updates: Partial<InboxCollection>) => void;
  handleInboxDrop: (itemId: string, sourceColId: string, toIndex: number) => void;
  handleInboxDropMulti: (itemIds: string[], sourceColId: string, toIndex: number) => void;
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
}

export const createInboxSlice: StateCreator<
  AppState,
  [["zustand/temporal", unknown]],
  [],
  InboxSlice
> = (set, get) => ({
  updateActiveCollection: (updates) =>
    set((state) => ({
      inbox: {
        ...state.inbox,
        collections: state.inbox.collections.map((c) =>
          c.id === state.inbox.activeCollectionId ? { ...c, ...updates } : c
        ),
      },
    })),
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
      item = collections.find((c) => c.id === sourceColId)?.items.find((i) => i.id === itemId);
    }
    if (!item) return;
    get().checkDuplicateAndProceed(item.imageSrc, () => {
      set((s) => {
        const currentRank = s.ranks[s.activeRankId];
        if (!currentRank) return s;
        let newCells = [...currentRank.cells];
        if (toIndex >= newCells.length) {
          const toAdd = toIndex - newCells.length + 1;
          newCells = [
            ...newCells,
            ...Array.from({ length: toAdd }).map((_, i) => ({
              id: `cell-${newCells.length + i}-${Date.now()}`,
              imageSrc: null,
              position: newCells.length + i,
            })),
          ];
        }
        newCells[toIndex] = { ...newCells[toIndex], imageSrc: item!.imageSrc };
        return {
          ranks: {
            ...s.ranks,
            [s.activeRankId]: { ...currentRank, cells: newCells, updatedAt: Date.now() },
          },
        };
      });
      get().handleUpdateLastTarget(sourceColId);
    });
  },
  handleInboxDropMulti: (itemIds, sourceColId, toIndex) => {
    const state = get();
    const activeRank = state.ranks[state.activeRankId];
    if (!activeRank || itemIds.length === 0) return;
    let validItems: InboxItem[] = [];
    if (sourceColId === "all" || sourceColId === "all-images") {
      validItems = state.inbox.collections.flatMap((c) => c.items).filter((i) => itemIds.includes(i.id));
    } else {
      const col = state.inbox.collections.find((c) => c.id === sourceColId);
      if (col) validItems = col.items.filter((i) => itemIds.includes(i.id));
    }
    if (validItems.length === 0) return;
    let hasShownDuplicateWaitWarning = false;
    const updateIndex = toIndex;
    if (!state.preferences.skipDuplicateWarning) {
      if (activeRank.type === "ranking") {
        hasShownDuplicateWaitWarning = true;
      }
    }
    set((s) => {
      const currentRank = s.ranks[s.activeRankId];
      if (!currentRank) return s;
      let newCells = [...currentRank.cells];
      let droppedCount = 0;
      for (const item of validItems) {
        if (!state.preferences.skipDuplicateWarning && currentRank.type === "ranking") {
          const isDuplicate = newCells.some((c) => c.imageSrc === item.imageSrc);
          if (isDuplicate) continue;
        }
        let targetIndex = updateIndex + droppedCount;
        if (targetIndex >= newCells.length) break;
        while (targetIndex < newCells.length && newCells[targetIndex].imageSrc) {
            targetIndex++;
        }
        if (targetIndex < newCells.length) {
            newCells[targetIndex] = { ...newCells[targetIndex], imageSrc: item.imageSrc };
            droppedCount++;
        }
      }
      return {
        ranks: {
          ...s.ranks,
          [s.activeRankId]: { ...currentRank, cells: newCells, updatedAt: Date.now() },
        },
      };
    });
    get().handleUpdateLastTarget(sourceColId);
  },
  handleSearchDrop: (imageSrc, toIndex) => {
    get().checkDuplicateAndProceed(imageSrc, () => {
      set((state) => {
        const currentRank = state.ranks[state.activeRankId];
        if (!currentRank) return state;
        let newCells = [...currentRank.cells];
        if (toIndex >= newCells.length) {
          const toAdd = toIndex - newCells.length + 1;
          newCells = [
            ...newCells,
            ...Array.from({ length: toAdd }).map((_, i) => ({
              id: `cell-${newCells.length + i}-${Date.now()}`,
              imageSrc: null,
              position: newCells.length + i,
            })),
          ];
        }
        newCells[toIndex] = { ...newCells[toIndex], imageSrc };
        return {
          ranks: {
             ...state.ranks,
             [state.activeRankId]: { ...currentRank, cells: newCells, updatedAt: Date.now() },
          },
        };
      });
      const st = get();
      const activeColId =
        st.inbox.activeCollectionId === "all-images"
          ? st.inbox.collections[0].id
          : st.inbox.activeCollectionId;
      get().handleAddToCollection(imageSrc, activeColId);
    });
  },
  handleAddToCollection: (imageSrc, collectionId) => {
    set((state) => {
      const newItem: InboxItem = {
        id: `inbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        imageSrc,
        createdAt: Date.now(),
      };
      return {
        inbox: {
          ...state.inbox,
          collections: state.inbox.collections.map((c) =>
            c.id === collectionId ? { ...c, items: [newItem, ...c.items] } : c
          ),
        },
      };
    });
  },
  handleUpdateLastTarget: (colId) => {
    set((s) => ({
      inbox: { ...s.inbox, lastDropTargetId: colId },
    }));
  },
  setIsDraggingFromDock: (v) =>
    set((s) => ({ inbox: { ...s.inbox, isDraggingFromDock: v } })),
  handleRestoreItem: (item, collectionId) => {
    set((state) => ({
      inbox: {
        ...state.inbox,
        collections: state.inbox.collections.map((c) =>
          c.id === collectionId ? { ...c, items: [...c.items, item] } : c
        ),
      },
    }));
  },
  handleInboxUpload: (dataUrl) => {
    set((state) => {
      const activeColId =
        state.inbox.activeCollectionId === "all-images"
          ? state.inbox.collections[0].id
          : state.inbox.activeCollectionId;
      const newItem: InboxItem = {
        id: `inbox-upload-${Date.now()}`,
        imageSrc: dataUrl,
        createdAt: Date.now(),
      };
      return {
        inbox: {
          ...state.inbox,
          collections: state.inbox.collections.map((c) =>
            c.id === activeColId ? { ...c, items: [newItem, ...c.items] } : c
          ),
        },
      };
    });
  },
  switchCollection: (id) =>
    set((state) => ({
      inbox: { ...state.inbox, activeCollectionId: id },
    })),
  addCollection: () =>
    set((state) => {
      const newCol = {
        id: `col-${Date.now()}`,
        name: "New Collection",
        items: [],
      };
      return {
        inbox: {
          ...state.inbox,
          collections: [...state.inbox.collections, newCol],
          activeCollectionId: newCol.id,
        },
      };
    }),
  deleteCollection: (id) =>
    set((state) => {
      if (state.inbox.collections.length <= 1) return state;
      const newCols = state.inbox.collections.filter((c) => c.id !== id);
      return {
        inbox: {
          ...state.inbox,
          collections: newCols,
          activeCollectionId: newCols[0].id,
        },
      };
    }),
  renameCollection: (id, name) =>
    set((state) => ({
      inbox: {
        ...state.inbox,
        collections: state.inbox.collections.map((c) => (c.id === id ? { ...c, name } : c)),
      },
    })),
  removeInboxItem: (id) =>
    set((state) => ({
      inbox: {
        ...state.inbox,
        collections: state.inbox.collections.map((c) => ({
          ...c,
          items: c.items.filter((i) => i.id !== id),
        })),
      },
    })),
});
