import { create } from "zustand";


export const DRAG_KIND = {
  CELL: "cell",
  INBOX_ITEM: "inbox-item",
  SEARCH_ITEM: "search-item",
  TIER_ITEM: "tier-item",
  TIER_ROW: "tier-row",
} as const;

export type DragKind = (typeof DRAG_KIND)[keyof typeof DRAG_KIND];

export interface ActiveDrag {
  kind: DragKind;
  /** The board/tier index the drag originated from, when applicable. */
  index?: number;
  /** dnd-kit id of the dragged node. */
  id?: string;
  /** True while the pointer is over a valid drop target. */
  overTarget: boolean;
}

interface DragState {
  activeDrag: ActiveDrag | null;
  lastDrop: { id: string; seq: number } | null;
  beginDrag: (drag: Omit<ActiveDrag, "overTarget">) => void;
  setOverTarget: (over: boolean) => void;
  setLastDrop: (id: string) => void;
  endDrag: () => void;
}

export const useDragState = create<DragState>((set) => ({
  activeDrag: null,
  lastDrop: null,
  beginDrag: (drag) => set({ activeDrag: { ...drag, overTarget: false } }),
  setOverTarget: (over) =>
    set((s) =>
      s.activeDrag && s.activeDrag.overTarget !== over
        ? { activeDrag: { ...s.activeDrag, overTarget: over } }
        : s
    ),
  setLastDrop: (id) =>
    set((s) => ({ lastDrop: { id, seq: (s.lastDrop?.seq ?? 0) + 1 } })),
  endDrag: () => set({ activeDrag: null }),
}));

/** The id of the drop target that most recently received something. */
export const useDropPulse = (id: string) =>
  useDragState((s) => (s.lastDrop?.id === id ? s.lastDrop.seq : 0));

/** True whenever anything at all is being dragged — used to reveal targets. */
export const useIsDragging = () => useDragState((s) => s.activeDrag !== null);
