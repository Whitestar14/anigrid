import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import { idbStorage, createDefaultState, migrateState } from "@/utils/storage";
import { GlobalState } from "@/types";
import { createGlobalSlice, GlobalSlice } from "./slices/globalSlice";
import { createRankSlice, RankSlice } from "./slices/rankSlice";
import { createInboxSlice, InboxSlice } from "./slices/inboxSlice";

export interface AppState extends GlobalState, GlobalSlice, RankSlice, InboxSlice { }

const initialDefaultState = createDefaultState();

export const useStore = create<AppState>()(
  temporal(
    persist(
      (set, get, api) => ({
        ...initialDefaultState,
        ...createGlobalSlice(set as any, get as any, api as any),
        ...createRankSlice(set as any, get as any, api as any),
        ...createInboxSlice(set as any, get as any, api as any),
      }),
      {
        name: "anime-ranker-state",
        storage: createJSONStorage(() => idbStorage),
        version: 3,
        migrate: (persistedState: any, version: number) => {
          if (version < 3) {
            return migrateState(persistedState) as AppState;
          }
          return persistedState as AppState;
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

