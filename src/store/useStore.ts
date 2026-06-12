import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo";
import { idbStorage, createDefaultState } from "@/utils/storage";
import { GlobalState } from "@/types";
import { createGlobalSlice, GlobalSlice } from "./slices/globalSlice";
import { createRankSlice, RankSlice } from "./slices/rankSlice";
import { createInboxSlice, InboxSlice } from "./slices/inboxSlice";
import { createTransferSlice, TransferSlice } from "./slices/transferSlice";

export interface AppState extends GlobalState, GlobalSlice, RankSlice, InboxSlice, TransferSlice { }

const initialDefaultState = createDefaultState();

export const useStore = create<AppState>()(
  temporal(
    persist(
      immer((set, get, api) => ({
        ...initialDefaultState,
        ...createGlobalSlice(set as any, get as any, api as any),
        ...createRankSlice(set as any, get as any, api as any),
        ...createInboxSlice(set as any, get as any, api as any),
        ...createTransferSlice(set as any, get as any, api as any),
      })),
      {
        name: "anime-ranker-state",
        storage: createJSONStorage(() => idbStorage),
        version: 3,
        migrate: (persistedState: any) => persistedState as AppState,
      }
    ),
    {
      partialize: (state) => ({
        ranks: state.ranks,
        inbox: state.inbox,
      }),
    }
  )
);

