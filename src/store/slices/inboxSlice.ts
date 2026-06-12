import { StateCreator } from "zustand";
import { AppState } from "../useStore";
import { InboxCollection, InboxItem } from "@/types";
import { findInboxItem, findInboxItems } from "@/utils/storeUtils";

export interface InboxSlice {
  updateActiveCollection: (updates: Partial<InboxCollection>) => void;

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
