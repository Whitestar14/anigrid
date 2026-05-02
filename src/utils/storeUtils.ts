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
export const findInboxItem = (inbox: GlobalState['inbox'], itemId: string, sourceColId: string): InboxItem | undefined => {
  const collections = inbox.collections;
  if (sourceColId === "all" || sourceColId === "all-images") {
    for (const col of collections) {
      const item = col.items.find((i) => i.id === itemId);
      if (item) return item;
    }
  } else {
    return collections.find((c) => c.id === sourceColId)?.items.find((i) => i.id === itemId);
  }
  return undefined;
};

export const findInboxItems = (inbox: GlobalState['inbox'], itemIds: string[], sourceColId: string): InboxItem[] => {
  if (sourceColId === "all" || sourceColId === "all-images") {
    return inbox.collections.flatMap((c) => c.items).filter((i) => itemIds.includes(i.id));
  } else {
    const col = inbox.collections.find((c) => c.id === sourceColId);
    return col ? col.items.filter((i) => itemIds.includes(i.id)) : [];
  }
};
export const ensureCells = (cells: CellData[], toIndex: number) => {
  if (toIndex >= cells.length) {
    const toAdd = toIndex - cells.length + 1;
    const startIdx = cells.length;
    for (let i = 0; i < toAdd; i++) {
      cells.push({
        id: `cell-${startIdx + i}-${Date.now()}`,
        imageSrc: null,
        position: startIdx + i,
      });
    }
  }
};
