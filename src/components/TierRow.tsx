import React, { useCallback, useRef, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  GripVertical,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Eraser,
  Trash2,
} from "lucide-react";
import { TierRow as TierRowData } from "@/types";
import { PopoverMenu } from "./ui/PopoverMenu";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { ColorPicker } from "./ui/ColorPicker";
import { TierItem, TierRail, TIER_TILE_HEIGHT } from "./TierItem";
import { getContrastColor } from "@/theme/palettes";

/** iOS system colours, the palette Apple uses for user-assigned tints. */
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

interface TierRowProps {
  row: TierRowData;
  index: number;
  aspectRatio: string;
  justify?: "left" | "center" | "right";
  onUpdate: (rowId: string, updates: Partial<TierRowData>) => void;
  onMove: (index: number, direction: "up" | "down") => void;
  onDelete: (index: number) => void;
}

export const TierRow = React.memo(function TierRow({
  row,
  index,
  aspectRatio,
  justify,
  onUpdate,
  onMove,
  onDelete,
}: TierRowProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [draftLabel, setDraftLabel] = useState(row.label);

  const labelRef = useRef<HTMLDivElement>(null);
  const textColor = getContrastColor(row.color);

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `tier-row-drop-${row.id}`,
    data: { type: "tier-row", index },
  });

  const { setNodeRef: setDraggableRef, attributes, listeners, isDragging } =
    useDraggable({
      id: `tier-row-drag-${row.id}`,
      data: {
        type: "tier-row",
        index,
        label: row.label,
        color: row.color,
        textColor,
      },
    });

  const setLabelRefs = useCallback(
    (node: HTMLDivElement | null) => {
      (labelRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      setDroppableRef(node);
    },
    [setDroppableRef]
  );

  const openMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Anchor to the button that was actually pressed. Anchoring to the label
    // block put the menu at the far left of the row, nowhere near the "⋯".
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect) setAnchor({ x: rect.left + rect.width / 2, y: rect.top + 12 });
    setIsMenuOpen(true);
  }, []);

  return (
    <div
      className="item-enter flex items-stretch border-t border-hairline bg-surface"
      style={{ "--enter-delay": `${Math.min(index, 14) * 26}ms` } as React.CSSProperties}
    >
      {/* ── Label block ─────────────────────────────────────────────── */}
      <div
        ref={setLabelRefs}
        className="relative w-[68px] sm:w-[104px] shrink-0 flex items-center justify-center
                   border-r border-hairline squircle"
        style={{
          backgroundColor: row.color,
          borderRadius: 0,
          opacity: isDragging ? 0.4 : 1,
          boxShadow: isOver
            ? "inset 0 0 0 2px var(--color-primary)"
            : undefined,
        }}
      >
        {/* Drag handle — kept separate so a click on the label can still open
            the editor without racing the drag sensor. */}
        <button
          ref={setDraggableRef}
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder tier ${row.label}`}
          className="absolute left-0.5 top-1/2 -translate-y-1/2 p-1 cursor-grab active:cursor-grabbing
                     opacity-40 hover:opacity-90 transition-opacity touch-none"
          style={{ color: textColor }}
        >
          <GripVertical size={14} />
        </button>

        <button
          type="button"
          onClick={() => {
            setDraftLabel(row.label);
            setIsEditorOpen(true);
          }}
          aria-label={`Edit tier ${row.label}`}
          className="w-full h-full px-4 py-4 text-center outline-none focus-visible:focus-ring"
          style={{ minHeight: TIER_TILE_HEIGHT + 16 }}
        >
          <span
            className="block text-title-2 font-bold leading-tight break-words"
            style={{ color: textColor }}
          >
            {row.label}
          </span>
        </button>
      </div>

      {/* ── Items rail ──────────────────────────────────────────────── */}
      <TierRail rowId={row.id} justify={justify}>
        {row.items.map((item, idx) => (
          <TierItem
            key={item.id}
            rowId={row.id}
            idx={idx}
            item={item}
            aspectRatio={aspectRatio}
          />
        ))}
      </TierRail>

      {/* ── Row controls ────────────────────────────────────────────── */}
      <div className="w-10 shrink-0 flex items-start justify-center pt-2 border-l border-hairline bg-surface">
        <button
          type="button"
          aria-label={`Tier ${row.label} options`}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={openMenu}
          className="flex items-center justify-center w-7 h-7 rounded-full text-muted
                     hover:text-text hover:bg-hover transition-colors touch-target"
        >
          <MoreHorizontal size={17} />
        </button>
      </div>

      <PopoverMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        actions={[
          {
            label: "Move Up",
            icon: ChevronUp,
            onClick: () => onMove(index, "up"),
          },
          {
            label: "Move Down",
            icon: ChevronDown,
            onClick: () => onMove(index, "down"),
          },
          {
            label: "Clear Items",
            icon: Eraser,
            onClick: () => onUpdate(row.id, { items: [] }),
          },
          {
            label: "Delete Tier",
            icon: Trash2,
            variant: "danger",
            onClick: () => onDelete(index),
          },
        ]}
        triggerPoint={anchor}
      />

      {/* ── Tier editor ─────────────────────────────────────────────── */}
      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title="Edit Tier"
        className="max-w-sm"
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-16 h-16 shrink-0 squircle"
              style={{ backgroundColor: row.color, borderRadius: 14 }}
            >
              <span
                className="text-title-2 font-bold"
                style={{ color: textColor }}
              >
                {draftLabel || "?"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <label
                htmlFor={`tier-label-${row.id}`}
                className="block text-caption-2 font-semibold text-muted uppercase tracking-[0.04em] mb-1.5"
              >
                Tier Name
              </label>
              <Input
                id={`tier-label-${row.id}`}
                value={draftLabel}
                maxLength={24}
                onChange={(e) => setDraftLabel(e.target.value)}
                placeholder="S"
              />
            </div>
          </div>

          <div>
            <span className="block text-caption-2 font-semibold text-muted uppercase tracking-[0.04em] mb-2">
              Colour
            </span>
            <div className="flex flex-wrap gap-2.5">
              {TIER_COLORS.map((color) => {
                const active = row.color.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Set tier colour ${color}`}
                    aria-pressed={active}
                    onClick={() => onUpdate(row.id, { color })}
                    className="w-8 h-8 rounded-full transition-transform duration-150 active:scale-90"
                    style={{
                      backgroundColor: color,
                      boxShadow: active
                        ? "0 0 0 2px var(--color-background), 0 0 0 4px var(--color-text)"
                        : "inset 0 0 0 0.5px var(--material-hairline)",
                    }}
                  />
                );
              })}

              <label
                className="relative w-8 h-8 rounded-full cursor-pointer flex items-center justify-center
                           overflow-hidden transition-transform duration-150 active:scale-90"
                style={{
                  background:
                    "conic-gradient(from 180deg, #ff453a, #ffd60a, #30d158, #0a84ff, #bf5af2, #ff453a)",
                  boxShadow:
                    !TIER_COLORS.some(
                      (c) => c.toLowerCase() === row.color.toLowerCase()
                    )
                      ? "0 0 0 2px var(--color-background), 0 0 0 4px var(--color-text)"
                      : "inset 0 0 0 0.5px var(--material-hairline)",
                }}
                title="Custom colour"
              >
                <ColorPicker
                  value={row.color}
                  onChange={(v) => onUpdate(row.id, { color: v })}
                />
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                onUpdate(row.id, {
                  label: (draftLabel || "?").trim() || "?",
                });
                setIsEditorOpen(false);
              }}
              className="flex-1 h-11 rounded-full bg-primary text-on-accent text-subheadline font-semibold
                         active:opacity-65 transition-opacity"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditorOpen(false)}
              className="flex-1 h-11 rounded-full bg-surface-secondary text-text text-subheadline font-semibold
                         active:opacity-65 transition-opacity"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
});
