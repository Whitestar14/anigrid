import { useCallback } from "react";
import { useStore } from "@/store/useStore";

export function useInboxItemInteraction() {
  const activeRankId = useStore((s) => s.activeRankId);

  return useCallback(
    (itemId: string, collectionId: string) => {
      const s = useStore.getState();
      const activeRank = s.ranks[activeRankId];
      if (!activeRank) return;

      const { interactionState } = s;

      // ── Place into a targeted grid cell ──────────────────────
      if (interactionState?.type === "cell") {
        s.handleItemTransfer({ type: "inbox", collectionId, itemId }, { type: "cell", index: interactionState.index });
        // Advance selection to next cell so the user can keep clicking inbox items
        const nextIndex = interactionState.index + 1;
        if (nextIndex < activeRank.cells.length) {
          s.setInteractionState({ type: "cell", index: nextIndex });
        } else {
          s.setInteractionState(null);
        }
        return;
      }

      // ── Place into a targeted tier row ───────────────────────
      if (interactionState?.type === "tier-item") {
        s.handleItemTransfer({ type: "inbox", collectionId, itemId }, { type: "tier", rowId: interactionState.rowId, targetIndex: -1 });
        s.setInteractionState(null);
        return;
      }

      // ── No explicit target: just mark inbox item as selected ─
      // Do NOT auto-fill cells. The user must click a grid cell first.
      s.setInteractionState({
        type: "inbox",
        itemId,
        collectionId,
      });
    },
    [activeRankId],
  );
}
