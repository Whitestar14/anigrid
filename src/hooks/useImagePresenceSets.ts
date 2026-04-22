import { useMemo } from "react";
import { useStore } from "@/store/useStore";

/**
 * Derived sets for inbox search checkmarks and stash gray-out.
 * Subscribes only to inbox + active rank shape, not the full store.
 */
export function useImagePresenceSets() {
  const inbox = useStore((s) => s.inbox);
  const activeRank = useStore((s) => s.ranks[s.activeRankId]);

  return useMemo(() => {
    const inboxImageSet = new Set<string>();
    inbox.collections.forEach((c) =>
      c.items.forEach((i) => inboxImageSet.add(i.imageSrc)),
    );

    const boardImageSet = new Set<string>();
    if (activeRank) {
      if (activeRank.type === "tierlist") {
        activeRank.tierRows.forEach((row) =>
          row.items.forEach((item) => {
            if (item.imageSrc) boardImageSet.add(item.imageSrc);
          }),
        );
      } else {
        activeRank.cells.forEach((cell) => {
          if (cell.imageSrc) boardImageSet.add(cell.imageSrc);
        });
      }
    }

    return { inboxImageSet, boardImageSet };
  }, [inbox, activeRank]);
}
