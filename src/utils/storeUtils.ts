import { GlobalState, CellData, InboxItem } from "@/types";

export const checkAndRescueImages = (
  removedCells: (CellData | InboxItem)[],
  currentState: GlobalState,
  _collectionToAddToId: string
) => {
  const allKnownImages = new Set<string>();
  currentState.inbox.collections.forEach((col) =>
    col.items.forEach((item) => allKnownImages.add(item.imageSrc))
  );
  const rescueItems: InboxItem[] = [];
  removedCells.forEach((cell, idx) => {
    if (cell.imageSrc && !allKnownImages.has(cell.imageSrc)) {
      rescueItems.push({
        id: `rescued-${Date.now()}-${idx}`,
        imageSrc: cell.imageSrc,
        createdAt: Date.now(),
      });
    }
  });
  return rescueItems;
};
