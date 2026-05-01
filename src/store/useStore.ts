import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import { AppState as RequiredAppState } from "./slices/globalSlice"; // Note: we'll redefine AppState below and rename imports to avoid conflict if needed
import { idbStorage } from "@/utils/storage";

import { GlobalState } from "@/types";
import { createGlobalSlice, GlobalSlice } from "./slices/globalSlice";
import { createRankSlice, RankSlice } from "./slices/rankSlice";
import { createInboxSlice, InboxSlice } from "./slices/inboxSlice";

export interface AppState extends GlobalState, GlobalSlice, RankSlice, InboxSlice {}

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
      (set, get, api) => ({
        ...defaultState,
        ...createGlobalSlice(set, get, api),
        ...createRankSlice(set, get, api),
        ...createInboxSlice(set, get, api),
      }),
      {
        name: "anime-ranker-state",
        storage: createJSONStorage(() => idbStorage),
        version: 3,
        migrate: (persistedState: any, _version: number) => {
          // Add basic migration logic, as migrateState is complex, let's keep it in storage.ts
          // Wait, storage.ts might already export it
          return persistedState as AppState; // Placeholder unless we import migrateState
        },
      }
    ),
    {
      partialize: (state) => {
        const { interactionState, duplicateModalConfig, ...rest } = state;
        return rest;
      },
    }
  )
);

