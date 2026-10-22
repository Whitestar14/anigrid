import React, { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { Plus, Layers } from "lucide-react";
import { TierRow as TierRowData } from "@/types";
import { useStore } from "@/store/useStore";
import { selectTierRows } from "@/store/selectors";
import { TierRow } from "@/components/TierRow";
import { selectActiveBoard } from "@/utils/boardStyle";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  DEFAULT_TIER_COLORS,
  FALLBACK_TIER_COLOR,
} from "@/constants/tierColors";
import { normalizeTierColor } from "@/utils/dominantColor";
import { newTierRowId } from "@/utils/storeUtils";

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
  const board = useStore(useShallow(selectActiveBoard));
  const rows = useStore(selectTierRows);

  /* These three read the current rows from the store instead of closing over
     them. A closure would take a new identity on every row edit, which defeats
     `TierRow`'s memo and re-renders the whole list — including every item in
     it — on each keystroke of a label. */
  const handleUpdateRow = useCallback(
    (rowId: string, updates: Partial<TierRowData>) => {
      const { ranks, activeRankId, handleUpdateTierRows } = useStore.getState();
      const rank = ranks[activeRankId];
      if (!rank) return;
      handleUpdateTierRows(
        rank.tierRows.map((r) =>
          r.id === rowId ? { ...r, ...updates } : r
        )
      );
    },
    []
  );

  const handleMoveRow = useCallback(
    (index: number, direction: "up" | "down") => {
      const { ranks, activeRankId, handleUpdateTierRows } = useStore.getState();
      const rank = ranks[activeRankId];
      if (!rank) return;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= rank.tierRows.length) return;
      const next = [...rank.tierRows];
      [next[index], next[target]] = [next[target], next[index]];
      handleUpdateTierRows(next);
    },
    []
  );

  const handleDeleteRow = useCallback((index: number) => {
    const { ranks, activeRankId, handleUpdateTierRows } = useStore.getState();
    const rank = ranks[activeRankId];
    if (!rank) return;
    handleUpdateTierRows(rank.tierRows.filter((_, i) => i !== index));
  }, []);

  const handleAddRow = useCallback(() => {
    const { ranks, activeRankId, handleUpdateTierRows } = useStore.getState();
    const rank = ranks[activeRankId];
    if (!rank) return;
    const used = new Set(rank.tierRows.map((r) => r.color.toLowerCase()));
    const color =
      DEFAULT_TIER_COLORS.find((c) => !used.has(c)) ?? FALLBACK_TIER_COLOR;
    handleUpdateTierRows([
      ...rank.tierRows,
      {
        id: newTierRowId(),
        label: nextTierLabel(rank.tierRows),
        color: normalizeTierColor(color),
        items: [],
      },
    ]);
  }, []);

  if (!board) return null;

  const itemCount = rows.reduce((sum, row) => sum + row.items.length, 0);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<Layers size={24} strokeWidth={1.8} />}
        title="No tiers yet"
        description="Add a tier to start sorting. Drag items in from the Library, or tap an item and then tap a tier."
        action={
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-1.5 h-10 px-5 rounded-full bg-primary text-on-accent
                       text-subheadline font-semibold active:opacity-65 transition-opacity"
          >
            <Plus size={17} strokeWidth={2.5} /> Add Tier
          </button>
        }
      />
    );
  }

  return (
    <div data-export-board="" className="flex flex-col w-full pb-16">
      <div
        data-export-hide=""
        className="flex items-center gap-2 px-1 pb-3 text-caption-1 text-muted"
      >
        <Layers size={13} />
        <span>
          {rows.length} {rows.length === 1 ? "tier" : "tiers"} · {itemCount}{" "}
          {itemCount === 1 ? "item" : "items"} placed
        </span>
      </div>

      {/* The sheet is rounded in both spacing modes. Spacing decides the shape
          of the *artwork* — square and flush, or rounded and guttered — while
          the sheet is one object on the page and keeps its corners regardless.
          Clipping here is what gives the first and last row their curve. */}
      <div className="border border-border rounded-card overflow-hidden squircle">
        {rows.map((row, index) => (
          <TierRow
            key={row.id}
            row={row}
            index={index}
            aspectRatio={board.aspectRatio}
            height={board.tierRowHeight}
            spacing={board.tierSpacing}
            justify={board.justify}
            onUpdate={handleUpdateRow}
            onMove={handleMoveRow}
            onDelete={handleDeleteRow}
          />
        ))}

        <button
          type="button"
          data-export-hide=""
          onClick={handleAddRow}
          className="group/add w-full flex items-center justify-center gap-2 h-12
                     border-t border-hairline bg-surface-secondary/40
                     text-muted hover:text-text hover:bg-hover
                     transition-colors duration-150"
        >
          <Plus size={17} strokeWidth={2.5} />
          <span className="text-subheadline font-medium">Add Tier</span>
        </button>
      </div>
    </div>
  );
});
