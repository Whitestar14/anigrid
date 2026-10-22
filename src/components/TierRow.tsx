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
import { TierItem, TierRail } from "./TierItem";
import { TierLabel } from "./tier/TierLabel";
import {
  DEFAULT_TIER_ROW_HEIGHT,
  DEFAULT_TIER_SPACING,
  tierGapFor,
  tierItemRadius,
  type TierSpacing,
} from "@/utils/boardStyle";
import { TIER_COLORS } from "@/constants/tierColors";
import { normalizeTierColor } from "@/utils/dominantColor";
import { getContrastColor } from "@/theme/palettes";

interface TierRowProps {
  row: TierRowData;
  index: number;
  aspectRatio: string;
  /** Item rail height, so every row lines up and the user can resize them. */
  height?: number;
  /** How items sit in the rail: spaced (rounded, guttered) or tight (flush). */
  spacing?: TierSpacing;
  justify?: "left" | "center" | "right";
  onUpdate: (rowId: string, updates: Partial<TierRowData>) => void;
  onMove: (index: number, direction: "up" | "down") => void;
  onDelete: (index: number) => void;
}

export const TierRow = React.memo(function TierRow({
  row,
  index,
  aspectRatio,
  height = DEFAULT_TIER_ROW_HEIGHT,
  spacing = DEFAULT_TIER_SPACING,
  justify,
  onUpdate,
  onMove,
  onDelete,
}: TierRowProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [draftLabel, setDraftLabel] = useState(row.label);

  const labelRef = useRef<HTMLButtonElement>(null);
  const textColor = getContrastColor(row.color);
  const isEmpty = row.items.length === 0;

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `tier-row-drop-${row.id}`,
    data: { type: "tier-row", index },
  });

  const {
    setNodeRef: setDraggableRef,
    attributes,
    listeners,
    isDragging,
  } = useDraggable({
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
    (node: HTMLButtonElement | null) => {
      (labelRef as React.MutableRefObject<HTMLButtonElement | null>).current =
        node;
      setDroppableRef(node);
      setDraggableRef(node);
    },
    [setDroppableRef, setDraggableRef],
  );

  const openMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect) setAnchor({ x: rect.left + rect.width / 2, y: rect.bottom + 4 });
    setIsMenuOpen(true);
  }, []);

  const railInset = tierGapFor(spacing);
  const itemRadius = tierItemRadius(height, spacing);
  const labelCap = Math.min(46, Math.round(height * 0.46));

  return (
    <div
      className="item-enter group/tier relative flex items-stretch bg-surface
                 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-hairline"
      style={
        {
          "--enter-delay": `${Math.min(index, 14) * 26}ms`,
        } as React.CSSProperties
      }
    >
      {/* ── Label block ─────────────────────────────────────────────── */}
      <button
        ref={setLabelRefs}
        type="button"
        {...attributes}
        {...listeners}
        onClick={(e) => {
          e.stopPropagation();
          setDraftLabel(row.label);
          setIsEditorOpen(true);
        }}
        aria-label={`Edit tier ${row.label}`}
        className="relative w-[72px] sm:w-[100px] shrink-0 grid place-items-center
                   cursor-grab active:cursor-grabbing touch-none outline-none
                   focus-visible:focus-ring transition-[filter] duration-150
                   hover:brightness-110"
        style={{
          backgroundColor: row.color,
          minHeight: height + railInset * 2,
          opacity: isDragging ? 0.4 : 1,
        }}
      >
        {isOver && (
          <span
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: "inset 0 0 0 2px var(--color-primary)" }}
          />
        )}

        <span
          aria-hidden
          data-export-hide=""
          className="absolute left-1 top-1 text-current opacity-0
                     group-hover/tier:opacity-45 transition-opacity duration-150"
          style={{ color: textColor }}
        >
          <GripVertical size={13} />
        </span>

        <TierLabel label={row.label} color={textColor} cap={labelCap} />
      </button>

      {/* ── Items rail ──────────────────────────────────────────────── */}
      <TierRail
        rowId={row.id}
        height={height}
        gap={railInset}
        itemRadius={itemRadius}
        aspectRatio={aspectRatio}
        justify={justify}
        isEmpty={isEmpty}
      >
        {row.items.map((item, idx) => (
          <TierItem
            key={item.id}
            rowId={row.id}
            idx={idx}
            item={item}
            aspectRatio={aspectRatio}
            height={height}
            spacing={spacing}
          />
        ))}
      </TierRail>

      {/* ── Row controls ────────────────────────────────────────────── */}
      <div
        data-export-hide=""
        className="relative w-[34px] shrink-0 flex items-center justify-center"
      >
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
              className="relative w-16 h-16 shrink-0 squircle overflow-hidden"
              style={{
                backgroundColor: row.color,
                borderRadius: "var(--radius-control)",
              }}
            >
              <TierLabel label={draftLabel || "?"} color={textColor} cap={30} />
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
                    onClick={() =>
                      onUpdate(row.id, { color: normalizeTierColor(color) })
                    }
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

              <ColorPicker
                label="Custom tier colour"
                value={row.color}
                onChange={(v) =>
                  onUpdate(row.id, { color: normalizeTierColor(v) })
                }
                className="w-8 h-8 rounded-full overflow-hidden"
                trigger={
                  <span
                    className="block w-8 h-8 rounded-full"
                    style={{
                      background:
                        "conic-gradient(from 180deg, #ff6b6b, #ffd43b, #69db7c, #4dabf7, #9775fa, #ff6b6b)",
                      boxShadow: !TIER_COLORS.some(
                        (c) => c.toLowerCase() === row.color.toLowerCase(),
                      )
                        ? "0 0 0 2px var(--color-background), 0 0 0 4px var(--color-text)"
                        : "inset 0 0 0 0.5px var(--material-hairline)",
                    }}
                  />
                }
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                onUpdate(row.id, { label: (draftLabel || "?").trim() || "?" });
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
