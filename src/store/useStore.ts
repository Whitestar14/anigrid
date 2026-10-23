import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo";
import {
  idbStorage,
  createDefaultState,
  migratePersistedState,
} from "@/utils/storage";
import { GlobalState } from "@/types";
import { resolveActiveRankId } from "@/utils/storeUtils";
import { createGlobalSlice, GlobalSlice } from "./slices/globalSlice";
import { createRankSlice, RankSlice } from "./slices/rankSlice";
import { createInboxSlice, InboxSlice } from "./slices/inboxSlice";
import { createTransferSlice, TransferSlice } from "./slices/transferSlice";

export interface AppState
  extends GlobalState, GlobalSlice, RankSlice, InboxSlice, TransferSlice {}

const initialDefaultState = createDefaultState();

export const useStore = create<AppState>()(
  temporal(
    persist(
      immer((set, get, api) => ({
        ...initialDefaultState,
        ...createGlobalSlice(set, get, api),
        ...createRankSlice(set, get, api),
        ...createInboxSlice(set, get, api),
        ...createTransferSlice(set, get, api),
      })),
      {
        name: "anime-ranker-state",
        storage: createJSONStorage(() => idbStorage),
        version: 4,
        migrate: (persistedState: any) =>
          migratePersistedState(persistedState) as AppState,
        merge: (persistedState: any, currentState: AppState) => {
          const merged = {
            ...currentState,
            ...(persistedState ?? {}),
          } as AppState;

          if (Object.keys(merged.ranks ?? {}).length === 0) {
            merged.ranks = currentState.ranks;
          }
          merged.activeRankId = resolveActiveRankId(
            merged.ranks,
            merged.activeRankId,
          );
          return merged;
        },
      },
    ),
    {
      partialize: (state) => ({
        activeRankId: state.activeRankId,
        ranks: state.ranks,
        inbox: state.inbox,
      }),
      // Bounded so a long session cannot grow the history without limit.
      limit: 100,
    },
  ),
);
