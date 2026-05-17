import { StateCreator } from "zustand";
import { AppState } from "../useStore";
import { InboxCollection, InboxItem } from "@/types";
import { findInboxItem, findInboxItems } from "@/utils/storeUtils";

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
  moveItemsToCollection: (itemIds: string[], targetColId: string) => void;
}

export const createInboxSlice: StateCreator<
  AppState,
  [["zustand/temporal", unknown], ["zustand/immer", never]],
  [],
  InboxSlice
> = (set, get) => ({
  updateActiveCollection: (updates) =>
    set((state) => {
      const collection = state.inbox.collections.find(
        (c) => c.id === state.inbox.activeCollectionId
      );
      if (collection) Object.assign(collection, updates);
    }),
  handleInboxDrop: (itemId, sourceColId, toIndex) => {
    const state = get();
    const item = findInboxItem(state.inbox, itemId, sourceColId);
    if (!item) return;

    state.checkDuplicateAndProceed(item.imageSrc, () => {
      set((draft) => {
        const currentRank = draft.ranks[draft.activeRankId];
        if (!currentRank) return;

        // Ensure enough cells
        if (toIndex >= currentRank.cells.length) {
          const toAdd = toIndex - currentRank.cells.length + 1;
          for (let i = 0; i < toAdd; i++) {
            currentRank.cells.push({
              id: `cell-${currentRank.cells.length}-${Date.now()}`,
              imageSrc: null,
              position: currentRank.cells.length,
            });
          }
        }
        currentRank.cells[toIndex].imageSrc = item.imageSrc;
        currentRank.updatedAt = Date.now();
      });
      get().handleUpdateLastTarget(sourceColId);
    });
  },
  handleInboxDropMulti: (itemIds, sourceColId, toIndex) => {
    const state = get();
    const activeRank = state.ranks[state.activeRankId];
    if (!activeRank || itemIds.length === 0) return;

    const validItems = findInboxItems(state.inbox, itemIds, sourceColId);
    if (validItems.length === 0) return;

    set((draft) => {
      const currentRank = draft.ranks[draft.activeRankId];
      if (!currentRank) return;

      let currentIdx = toIndex;
      for (const item of validItems) {
        if (!draft.preferences.skipDuplicateWarning && currentRank.type === "ranking") {
          if (currentRank.cells.some((c) => c.imageSrc === item.imageSrc)) continue;
        }

        // Find next empty cell or append
        while (currentIdx < currentRank.cells.length && currentRank.cells[currentIdx].imageSrc) {
          currentIdx++;
        }

        if (currentIdx >= currentRank.cells.length) {
          currentRank.cells.push({
            id: `cell-${currentRank.cells.length}-${Date.now()}`,
            imageSrc: item.imageSrc,
            position: currentRank.cells.length,
          });
        } else {
          currentRank.cells[currentIdx].imageSrc = item.imageSrc;
        }
        currentIdx++;
      }
      currentRank.updatedAt = Date.now();
    });
    get().handleUpdateLastTarget(sourceColId);
  },
  handleSearchDrop: (imageSrc, toIndex) => {
    const state = get();
    state.checkDuplicateAndProceed(imageSrc, () => {
      set((draft) => {
        const currentRank = draft.ranks[draft.activeRankId];
        if (!currentRank) return;

        if (toIndex >= currentRank.cells.length) {
          const toAdd = toIndex - currentRank.cells.length + 1;
          for (let i = 0; i < toAdd; i++) {
            currentRank.cells.push({
              id: `cell-${currentRank.cells.length}-${Date.now()}`,
              imageSrc: null,
              position: currentRank.cells.length,
            });
          }
        }
        currentRank.cells[toIndex].imageSrc = imageSrc;
        currentRank.updatedAt = Date.now();

        const activeColId =
          draft.inbox.activeCollectionId === "all-images"
            ? draft.inbox.collections[0].id
            : draft.inbox.activeCollectionId;
        
        const col = draft.inbox.collections.find(c => c.id === activeColId);
        if (col && !col.items.some(i => i.imageSrc === imageSrc)) {
           col.items.push({
             id: `inbox-add-${Date.now()}`,
             imageSrc,
             createdAt: Date.now()
           });
        }
      });

      // Background Optimization: Fetch and cache as base64
      import("@/utils/imageProxy").then(({ fetchAndCacheImage }) => {
        fetchAndCacheImage(imageSrc).then(base64 => {
          if (base64) {
            set(d => {
              const r = d.ranks[d.activeRankId];
              if (r && r.cells[toIndex]) r.cells[toIndex].imageSrc = base64;
              
              d.inbox.collections.forEach(c => {
                c.items.forEach(it => {
                  if (it.imageSrc === imageSrc) it.imageSrc = base64;
                });
              });
            });
          }
        });
      });
    });
  },
  handleAddToCollection: (imageSrc, collectionId) =>
    set((state) => {
      const col = state.inbox.collections.find((c) => c.id === collectionId);
      if (col && !col.items.some((i) => i.imageSrc === imageSrc)) {
        col.items.push({
          id: `inbox-add-${Date.now()}`,
          imageSrc,
          createdAt: Date.now(),
        });
      }
    }),
  handleUpdateLastTarget: (colId) =>
    set((state) => {
      state.inbox.lastTargetCollectionId = colId;
    }),
  setIsDraggingFromDock: (v) =>
    set((state) => {
      state.inbox.isDraggingFromDock = v;
    }),
  handleRestoreItem: (item, collectionId) =>
    set((state) => {
      const col = state.inbox.collections.find((c) => c.id === collectionId);
      if (col && !col.items.some((i) => i.id === item.id)) {
        col.items.push(item);
      }
    }),
  handleInboxUpload: (dataUrl) =>
    set((state) => {
      const targetColId =
        state.inbox.activeCollectionId === "all-images"
          ? state.inbox.collections[0].id
          : state.inbox.activeCollectionId;
      const col = state.inbox.collections.find((c) => c.id === targetColId);
      if (col) {
        col.items.unshift({
          id: `inbox-upload-${Date.now()}`,
          imageSrc: dataUrl,
          createdAt: Date.now(),
        });
      }
    }),
  switchCollection: (id) =>
    set((state) => {
      state.inbox.activeCollectionId = id;
    }),
  addCollection: () =>
    set((state) => {
      const newId = `col-${Date.now()}`;
      state.inbox.collections.push({
        id: newId,
        name: "New Collection",
        items: [],
      });
      state.inbox.activeCollectionId = newId;
    }),
  deleteCollection: (id) =>
    set((state) => {
      state.inbox.collections = state.inbox.collections.filter((c) => c.id !== id);
      if (state.inbox.activeCollectionId === id) {
        state.inbox.activeCollectionId = state.inbox.collections[0]?.id || "";
      }
    }),
  renameCollection: (id, name) =>
    set((state) => {
      const col = state.inbox.collections.find((c) => c.id === id);
      if (col) col.name = name;
    }),
  removeInboxItem: (id) =>
    set((state) => {
      state.inbox.collections.forEach((col) => {
        col.items = col.items.filter((i) => i.id !== id);
      });
    }),
  moveItemsToCollection: (itemIds, targetColId) =>
    set((state) => {
      const targetCol = state.inbox.collections.find((c) => c.id === targetColId);
      if (!targetCol) return;

      const itemsToMove: InboxItem[] = [];

      state.inbox.collections.forEach((col) => {
        if (col.id === targetColId) return;
        const matching = col.items.filter((i) => itemIds.includes(i.id));
        if (matching.length > 0) {
          col.items = col.items.filter((i) => !itemIds.includes(i.id));
          itemsToMove.push(...matching);
        }
      });

      targetCol.items.unshift(...itemsToMove);
    }),
});
