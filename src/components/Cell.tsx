import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Plus, Check, X, MoreHorizontal } from "lucide-react";
import { useStore } from "@/store/useStore";
import { selectActiveRank } from "@/store/selectors";
import { downloadImage } from "@/utils/imageProxy";
import { UrlInputModal } from "@/components/ui/UrlInputModal";
import { RemoteImage } from "@/components/ui/RemoteImage";
import { PopoverMenu } from "@/components/ui/PopoverMenu";
import { usePanZoom } from "@/hooks/usePanZoom";
import { useCellInteraction } from "@/hooks/useCellInteraction";
import { useCellMediaUpload } from "@/hooks/useCellMediaUpload";
import {
  filledImageActions,
  emptyImageActions,
} from "@/components/ui/imageActions";
import { useIsDragging, useDropPulse } from "@/state/dragState";

interface CellProps {
  index: number;
  cols: number;
  /** Total tiles, so the last row can draw the board's bottom rule. */
  count: number;
  tabbable: boolean;
  onFocusTile: (index: number) => void;
}

const aspectToCss = (ratio?: string) =>
  ratio ? ratio.replace(":", " / ") : "3 / 4";

export const Cell = React.memo(function Cell({
  index,
  cols,
  count,
  tabbable,
  onFocusTile,
}: CellProps) {
  const cell = useStore((s) => s.ranks[s.activeRankId]?.cells[index]);
  const rank = useStore(selectActiveRank);
  const isDraggingAny = useIsDragging();

  const handleCellClear = useStore((s) => s.handleCellClear);
  const handleUpdateCell = useStore((s) => s.handleUpdateCell);
  const handleCellUpload = useStore((s) => s.handleCellUpload);
  const handleItemTransfer = useStore((s) => s.handleItemTransfer);

  const tileRef = useRef<HTMLDivElement>(null);
  const [isFileDragOver, setIsFileDragOver] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  const { isSelected, handleInteraction, clearInteraction } =
    useCellInteraction({ type: "cell", index });

  const { fileInputRef, triggerPicker, handleFileChange } = useCellMediaUpload(
    (base64) => {
      handleCellUpload(index, base64 as string);
      clearInteraction();
    }
  );

  const {
    isAdjusting,
    imageStyle,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    startAdjusting,
    stopAdjusting,
    saveAdjustments,
  } = usePanZoom(
    {
      zoom: cell?.zoom,
      posX: cell?.objectPosition
        ? parseInt(cell.objectPosition.split(" ")[0])
        : 50,
      posY: cell?.objectPosition
        ? parseInt(cell.objectPosition.split(" ")[1])
        : 50,
    },
    tileRef,
    (state) =>
      handleUpdateCell(index, {
        zoom: state.zoom,
        objectPosition: `${state.posX}% ${state.posY}%`,
      })
  );

  const dropId = `cell-drop-${cell?.id ?? index}`;
  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: dropId,
    data: { type: "cell", index },
  });
  const dropPulse = useDropPulse(dropId);

  const { isDragging, setNodeRef: setDraggableRef, attributes, listeners } =
    useDraggable({
      id: `cell-drag-${cell?.id ?? index}`,
      data: {
        type: "cell",
        index,
        imageSrc: cell?.imageSrc,
        width: tileRef.current?.offsetWidth || 120,
        aspectRatio: (rank?.aspectRatio || "3:4").replace(":", "/"),
      },
      disabled: !cell?.imageSrc || isAdjusting,
    });

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      (tileRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      setDroppableRef(node);
      setDraggableRef(node);
    },
    [setDroppableRef, setDraggableRef]
  );

  const wasSelectedRef = useRef(isSelected);
  useEffect(() => {
    const wasSelected = wasSelectedRef.current;
    wasSelectedRef.current = isSelected;
    if (wasSelected && !isSelected) setIsMenuOpen(false);
  }, [isSelected]);

  const openMenu = useCallback(
    (e: React.MouseEvent, anchorTo?: HTMLElement | null) => {
      e.stopPropagation();
      e.preventDefault();
      if (anchorTo) {
        const rect = anchorTo.getBoundingClientRect();
        setAnchor({ x: rect.left + rect.width / 2, y: rect.bottom + 4 });
      } else if (e.clientX || e.clientY) {
        setAnchor({ x: e.clientX, y: e.clientY });
      } else {
        const rect = tileRef.current?.getBoundingClientRect();
        if (rect) setAnchor({ x: rect.left + rect.width / 2, y: rect.top + 12 });
      }
      setIsMenuOpen(true);
    },
    []
  );

  const handleActivate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isAdjusting) return;
      handleInteraction(e.clientX, e.clientY, e.target as HTMLElement);
    },
    [handleInteraction, isAdjusting]
  );

  const handleDownload = useCallback(() => {
    if (!cell?.imageSrc) return;
    void downloadImage(
      cell.imageSrc,
      `${rank?.title?.replace(/\s+/g, "-").toLowerCase() || "image"}-${
        index + 1
      }.jpg`
    );
  }, [cell?.imageSrc, rank?.title, index]);

  if (!cell || !rank) return null;

  const hasImage = !!cell.imageSrc;
  const isSeamless = (rank.style ?? "seamless") === "seamless";
  // Seamless tiles have square corners so a ranked board reads as a single
  // collage; card tiles are individually rounded.
  const radius = isSeamless ? 0 : rank.borderRadius ?? 16;
  /* Whether to draw rules is an independent choice from the tile style. Seamless
     used to force it off, which meant a seamless board could never be ruled. */
  const borderless = rank.borderless ?? false;
  const showNumber = rank.showNumbers ?? true;
  const gap = rank.gap ?? 0;

  const hairline = "var(--material-hairline)";
  const restingShadow = borderless
    ? undefined
    : gap > 0
      ? // Tiles are separated, so each is its own object and gets a full rule.
        `0 0 0 0.5px ${hairline}`
      : [
          `0 -0.5px 0 0 ${hairline}`,
          `-0.5px 0 0 0 ${hairline}`,
          index % cols === cols - 1 ? `0.5px 0 0 0 ${hairline}` : null,
          index + cols >= count ? `0 0.5px 0 0 ${hairline}` : null,
        ]
          .filter(Boolean)
          .join(", ");

  const actions = hasImage
    ? filledImageActions({
        onReplace: triggerPicker,
        onAdjust: startAdjusting,
        onDownload: handleDownload,
        onReturnToLibrary: () =>
          handleItemTransfer({ type: "cell", index }, { type: "inbox" }),
        onRemove: () => handleCellClear(index),
      })
    : emptyImageActions({
        onChooseFile: triggerPicker,
        onFromUrl: () => setIsUrlModalOpen(true),
        onSearchOnline: () =>
          window.dispatchEvent(new CustomEvent("open-inbox-search")),
      });

  return (
    <div
      ref={setRefs}
      /* dnd-kit's attributes set role="button" and its own tabIndex; they are
         spread first so the grid semantics below win. */
      {...attributes}
      {...listeners}
      role="gridcell"
      tabIndex={tabbable ? 0 : -1}
      aria-rowindex={Math.floor(index / cols) + 1}
      aria-colindex={(index % cols) + 1}
      aria-selected={isSelected}
      /* dnd-kit marks a non-draggable cell aria-disabled, but an empty cell is
         still selectable, so it must stay enabled to assistive tech. */
      aria-disabled={isAdjusting || undefined}
      aria-label={
        hasImage ? `Position ${index + 1}, filled` : `Position ${index + 1}, empty`
      }
      data-cell-index={index}
      className={`tile item-enter group/tile relative select-none outline-none [container-type:inline-size] ${
        hasImage ? "touch-none" : ""
      } ${isDragging ? "z-30 opacity-25" : "z-0"}`}
      style={{
        aspectRatio: aspectToCss(rank.aspectRatio),
        // Capped so a large board still finishes settling quickly, and reads as
        // a sweep from the top-left rather than an endless ripple.
        "--enter-delay": `${Math.min(index, 14) * 26}ms`,
      } as React.CSSProperties}
      onClick={handleActivate}
      /* Double-click replaces the image in one gesture. The tile menu can do it
         too, but replacing is the single most common edit and making it two
         clicks plus a menu was the kind of friction that adds up. */
      onDoubleClick={(e) => {
        if (!hasImage || isAdjusting) return;
        e.stopPropagation();
        triggerPicker();
      }}
      onFocus={() => onFocusTile(index)}
      onContextMenu={openMenu}
      onDragOver={(e) => {
        e.preventDefault();
        setIsFileDragOver(true);
      }}
      onDragLeave={() => setIsFileDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsFileDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result)
            handleCellUpload(index, ev.target.result as string);
        };
        reader.readAsDataURL(file);
      }}
    >
      <div
        className={`relative w-full h-full overflow-hidden squircle ${
          isOver ? "drop-target" : ""
        } ${isOver ? "scale-[1.03]" : ""} transition-transform duration-150 ease-spring`}
        style={{
          borderRadius: radius,
          boxShadow: isSelected
            ? "0 0 0 2px var(--color-primary)"
            : isFileDragOver && !isOver
              ? "0 0 0 2px var(--color-primary), 0 0 0 6px color-mix(in srgb, var(--color-primary) 22%, transparent)"
              : restingShadow,
        }}
      >
        {hasImage ? (
          <RemoteImage
            src={cell.imageSrc!}
            alt=""
            decoding="async"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={imageStyle}
          />

        ) : (
          <button
            type="button"
            aria-label={`Add image to position ${index + 1}`}
            onClick={openMenu}
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-1.5
                       card-veil hover:bg-hover transition-colors duration-150
                       text-muted hover:text-text cursor-pointer"
          >
            {/* `media-scrim`, not `material-thin`: this control is drawn on the
                board sheet, whose colour the user chose, so a material that
                tracks the *appearance* rather than the surface underneath it is
                invisible over half the boards we allow. See `.media-scrim`. */}
            <span
              className={`flex items-center justify-center rounded-full media-scrim
                          w-[19cqi] h-[19cqi] min-w-8 min-h-8 max-w-14 max-h-14
                          transition-transform duration-200 ease-spring ${
                            isDraggingAny
                              ? "scale-110"
                              : "group-hover/tile:scale-105"
                          }`}
              style={
                isDraggingAny
                  ? {
                      boxShadow:
                        "0 0 0 1.5px var(--color-primary), inset 0 0 0 0.5px rgba(255,255,255,0.2)",
                      color: "var(--color-primary)",
                    }
                  : undefined
              }
            >
              <Plus size={18} strokeWidth={2.5} className="w-[46%] h-[46%]" />
            </span>
            <span className="text-caption-1 font-medium">Add</span>
          </button>
        )}

        {/* The rank numeral: set large, hung off the corner so the tile clips
            it, and filled with a gradient so it reads over any artwork without
            a plate behind it. See `.tile-number`. */}
        {hasImage && showNumber && (
          <span aria-hidden className="tile-number">
            {index + 1}
          </span>
        )}

        {hasImage && (
          <button
            type="button"
            aria-label="Tile actions"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            onClick={(e) => openMenu(e, e.currentTarget)}
            className="absolute top-1.5 right-1.5 z-10 flex items-center justify-center w-[22px] h-[22px]
                       media-scrim squircle hover:brightness-125 active:scale-95
                       transition-transform duration-150 affordance touch-target"
            style={{ borderRadius: 8 }}
          >
            <MoreHorizontal size={14} strokeWidth={2.5} />
          </button>
        )}

        {isAdjusting && (
          <div
            className="absolute inset-0 z-20 flex flex-col justify-between p-2 cursor-move select-none touch-none"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            <span className="self-center media-scrim text-caption-2 font-semibold px-2.5 py-1 rounded-full">
              Drag to reposition · Scroll to zoom
            </span>
            <div className="self-center flex gap-2">
              <button
                type="button"
                aria-label="Cancel adjustments"
                onClick={(e) => {
                  e.stopPropagation();
                  stopAdjusting();
                }}
                className="flex items-center justify-center w-9 h-9 media-scrim rounded-full active:scale-90 transition-transform"
              >
                <X size={17} />
              </button>
              <button
                type="button"
                aria-label="Save adjustments"
                onClick={(e) => {
                  e.stopPropagation();
                  saveAdjustments();
                  clearInteraction();
                }}
                className="flex items-center justify-center w-9 h-9 rounded-full text-on-accent active:scale-90 transition-transform"
                style={{ background: "var(--color-primary)" }}
              >
                <Check size={17} />
              </button>
            </div>
          </div>
        )}

        {!hasImage && (isOver || isFileDragOver) && (
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background:
                "color-mix(in srgb, var(--color-primary) 14%, transparent)",
            }}
          />
        )}

        {/* Landing pulse. Keyed on the drop sequence so it replays even when
            the same tile receives two drops in a row. */}
        {dropPulse > 0 && (
          <span
            key={dropPulse}
            aria-hidden
            className="drop-land absolute inset-0 z-30 pointer-events-none"
            style={{ borderRadius: radius }}
          />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <PopoverMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        actions={actions}
        triggerPoint={anchor}
      />

      <UrlInputModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onSubmit={(url) => {
          handleItemTransfer(
            { type: "search", imageSrc: url },
            { type: "cell", index }
          );
          clearInteraction();
        }}
      />
    </div>
  );
});
