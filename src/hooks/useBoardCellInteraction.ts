import { useCallback } from "react";
import { useStore } from "@/store/useStore";

/** Resolves a grid/list cell click given the current drag/interaction mode. */
export function useBoardCellInteraction() {
  return useCallback((index: number) => {
    const s = useStore.getState();
    const { interactionState } = s;

    if (interactionState?.type === "inbox") {
      s.handleInboxDrop(
        interactionState.itemId,
        interactionState.collectionId,
        index,
      );
      s.setInteractionState(null);
      return;
    }
    if (interactionState?.type === "inbox-multi") {
      s.handleInboxDropMulti(
        interactionState.itemIds,
        interactionState.collectionId,
        index,
      );
      s.setInteractionState(null);
      return;
    }
    if (interactionState?.type === "search") {
      s.handleSearchDrop(interactionState.imageSrc, index);
      s.setInteractionState(null);
      return;
    }
    if (interactionState?.type === "cell") {
      s.handleSwapCells(interactionState.index, index);
      s.setInteractionState(null);
      return;
    }
    s.setInteractionState({ type: "cell", index });
  }, []);
}
