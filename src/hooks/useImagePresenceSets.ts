import { useMemo } from "react";
import { useStore } from "@/store/useStore";

/**
 * Derived sets for inbox search checkmarks and stash gray-out.
 * Subscribes only to inbox + active rank shape, not the full store.
 */
export function useImagePresenceSets() {
  const collections = useStore((s) => s.inbox.collections);
  const activeRank = useStore((s) => s.ranks[s.activeRankId]);

  // Stable board data selector
  const boardItems = useMemo(() => {
    if (!activeRank) return [];
    return activeRank.type === 'tierlist' 
      ? activeRank.tierRows.flatMap(r => r.items)
      : activeRank.cells;
  }, [activeRank]);

  return useMemo(() => {
    const inboxImageSet = new Set<string>();
    collections.forEach((c) =>
      c.items.forEach((i) => inboxImageSet.add(i.imageSrc)),
    );

    const boardImageSet = new Set<string>();
    boardItems.forEach((item) => {
      if (item.imageSrc) boardImageSet.add(item.imageSrc);
    });

    return { inboxImageSet, boardImageSet };
  }, [collections, boardItems]);
}
