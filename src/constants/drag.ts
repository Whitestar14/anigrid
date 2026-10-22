export const DRAG_TYPE = {
  CELL: "cell",
  INBOX_ITEM: "inbox-item",
  SEARCH_ITEM: "search-item",
  TIER_ITEM: "tier-item",
  TIER_ROW: "tier-row",
} as const;

export const DROP_TYPE = {
  CELL: "cell",
  TIER_CELL: "tier-cell",
  TIER_ROW: "tier-row",
  DOCK: "inbox-trash",
} as const;

export type DragKind = (typeof DRAG_TYPE)[keyof typeof DRAG_TYPE];
