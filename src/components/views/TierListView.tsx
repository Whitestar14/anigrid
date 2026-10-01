import React, { useCallback } from "react";
import { Plus, Layers } from "lucide-react";
import { TierRow as TierRowData } from "@/types";
import { useStore } from "@/store/useStore";
import { selectActiveRank, selectTierRows } from "@/store/selectors";
import { TierRow } from "@/components/TierRow";
import { CuteSlime } from "@/components/EmptyStateVector";

const TIER_COLORS = [
  "#FF453A",
  "#FF9F0A",
  "#FFD60A",
  "#30D158",
  "#64D2FF",
  "#0A84FF",
  "#5E5CE6",
  "#BF5AF2",
  "#FF375F",
  "#8E8E93",
];

/** Next unused single letter, so a new tier is named sensibly by default. */
function nextTierLabel(rows: TierRowData[]): string {
  const used = new Set(rows.map((r) => r.label.trim().toUpperCase()));
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i);
    if (!used.has(letter)) return letter;
  }
  return "NEW";
}

export const TierListView = React.memo(function TierListView() {
  const rank = useStore(selectActiveRank);
  const rows = useStore(selectTierRows);
  const handleUpdateTierRows = useStore((s) => s.handleUpdateTierRows);

  const handleUpdateRow = useCallback(
    (rowId: string, updates: Partial<TierRowData>) => {
      if (!rank) return;
      handleUpdateTierRows(
        rank.tierRows.map((r) => (r.id === rowId ? { ...r, ...updates } : r))
      );
    },
    [rank, handleUpdateTierRows]
  );

  const handleMoveRow = useCallback(
    (index: number, direction: "up" | "down") => {
      if (!rank) return;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= rank.tierRows.length) return;
      const next = [...rank.tierRows];
      [next[index], next[target]] = [next[target], next[index]];
      handleUpdateTierRows(next);
    },
    [rank, handleUpdateTierRows]
  );

  const handleDeleteRow = useCallback(
    (index: number) => {
      if (!rank) return;
      handleUpdateTierRows(rank.tierRows.filter((_, i) => i !== index));
    },
    [rank, handleUpdateTierRows]
  );

  const handleAddRow = useCallback(() => {
    if (!rank) return;
    const used = new Set(rank.tierRows.map((r) => r.color.toLowerCase()));
    const color =
      TIER_COLORS.find((c) => !used.has(c.toLowerCase())) ?? "#8E8E93";
    handleUpdateTierRows([
      ...rank.tierRows,
      {
        id: `tier-${Date.now()}`,
        label: nextTierLabel(rank.tierRows),
        color,
        items: [],
      },
    ]);
  }, [rank, handleUpdateTierRows]);

  if (!rank) return null;

  const itemCount = rows.reduce((sum, row) => sum + row.items.length, 0);
  const aspectRatio = rank.aspectRatio || "3:4";

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <CuteSlime className="w-16 h-16 text-muted" />
        <div className="flex flex-col gap-1">
          <span className="text-body font-semibold text-text">No tiers yet</span>
          <span className="text-footnote text-muted max-w-xs">
            Add a tier to start sorting. Drag items in from the Library, or tap
            an item and then tap a tier.
          </span>
        </div>
        <button
          type="button"
          onClick={handleAddRow}
          className="flex items-center gap-1.5 h-10 px-5 rounded-full bg-primary text-on-accent
                     text-subheadline font-semibold active:opacity-65 transition-opacity"
        >
          <Plus size={17} strokeWidth={2.5} /> Add Tier
        </button>
      </div>
    );
  }

  return (
    <div data-export-board="" className="flex flex-col w-full max-w-6xl mx-auto pb-16">
      <div className="flex items-center gap-2 px-1 pb-3 text-caption-1 text-muted">
        <Layers size={13} />
        <span>
          {rows.length} {rows.length === 1 ? "tier" : "tiers"} · {itemCount}{" "}
          {itemCount === 1 ? "item" : "items"} placed
        </span>
      </div>

      <div className="rounded-panel overflow-hidden border border-border squircle">
        {rows.map((row, index) => (
          <TierRow
            key={row.id}
            row={row}
            index={index}
            aspectRatio={aspectRatio}
            justify={rank.gridJustify}
            onUpdate={handleUpdateRow}
            onMove={handleMoveRow}
            onDelete={handleDeleteRow}
          />
        ))}

        <button
          type="button"
          onClick={handleAddRow}
          className="w-full flex items-center justify-center gap-2 min-h-[3.5rem] border-t border-border
                     bg-surface-secondary hover:bg-hover text-muted hover:text-text
                     transition-colors duration-150"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span className="text-subheadline font-medium">Add Tier</span>
        </button>
      </div>
    </div>
  );
});
