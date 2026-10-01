import React, { useCallback, useRef, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Check, X, MoreHorizontal } from "lucide-react";
import { CellData } from "@/types";
import { PopoverMenu } from "./ui/PopoverMenu";
import { RemoteImage } from "./ui/RemoteImage";
import { filledImageActions } from "./ui/imageActions";
import { useCellInteraction } from "@/hooks/useCellInteraction";
import { useCellMediaUpload } from "@/hooks/useCellMediaUpload";
import { usePanZoom } from "@/hooks/usePanZoom";
import { useDropPulse } from "@/state/dragState";
import { useStore } from "@/store/useStore";
import { downloadImage } from "@/utils/imageProxy";
import { widthForHeight } from "@/utils/ui";

/** Shared rail height so every tier row lines up regardless of aspect ratio. */
export const TIER_TILE_HEIGHT = 88;

interface TierItemProps {
  rowId: string;
  idx: number;
  item: CellData;
  aspectRatio: string;
}

export const TierItem = React.memo(function TierItem({
  rowId,
  idx,
  item,
  aspectRatio,
}: TierItemProps) {
  const handleItemTransfer = useStore((s) => s.handleItemTransfer);
  const handleUpdateTierItem = useStore((s) => s.handleUpdateTierItem);
  const handleTierItemRemove = useStore((s) => s.handleTierItemRemove);

  const tileRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  const { isSelected, handleInteraction, clearInteraction } = useCellInteraction({
    type: "tier-item",
    index: idx,
    rowId,
    itemId: item.id,
  });

  /* Tier items could not be swapped for a different image at all — the menu
     offered Crop and nothing else. Same picker as a grid tile, writing back to
     the tier position. */
  const { fileInputRef, triggerPicker, handleFileChange } = useCellMediaUpload(
    (base64) => {
      handleUpdateTierItem(rowId, item.id, { imageSrc: base64 as string });
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
      zoom: item.zoom,
      posX: item.objectPosition ? parseInt(item.objectPosition.split(" ")[0]) : 50,
      posY: item.objectPosition ? parseInt(item.objectPosition.split(" ")[1]) : 50,
    },
    tileRef,
    (state) =>
      handleUpdateTierItem(rowId, item.id, {
        zoom: state.zoom,
        objectPosition: `${state.posX}% ${state.posY}%`,
      })
  );

  const dropId = `tier-drop-${rowId}-${idx}`;
  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: dropId,
    data: { type: "tier-cell", rowId, index: idx },
  });
  const dropPulse = useDropPulse(dropId);

  const { isDragging, setNodeRef: setDraggableRef, attributes, listeners } =
    useDraggable({
      id: `tier-drag-${rowId}-${item.id}`,
      data: {
        type: "tier-item",
        rowId,
        id: item.id,
        imageSrc: item.imageSrc,
        width: widthForHeight(aspectRatio, TIER_TILE_HEIGHT),
        aspectRatio: (aspectRatio || "3:4").replace(":", "/"),
      },
      disabled: !item.imageSrc || isAdjusting,
    });

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      (tileRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      setDroppableRef(node);
      setDraggableRef(node);
    },
    [setDroppableRef, setDraggableRef]
  );

  const openMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = tileRef.current?.getBoundingClientRect();
    if (rect) setAnchor({ x: rect.left + rect.width / 2, y: rect.top + 12 });
    setIsMenuOpen(true);
  }, []);

  const width = widthForHeight(aspectRatio, TIER_TILE_HEIGHT);

  return (
    <div
      ref={setRefs}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-label={`Tier item, position ${idx + 1}`}
      onClick={(e) => {
        if (isAdjusting) return;
        handleInteraction(e.clientX, e.clientY, e.target as HTMLElement);
      }}
      onContextMenu={openMenu}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openMenu(e as unknown as React.MouseEvent);
        }
      }}
      /* Draggable, so the touch sensor needs to own the gesture; without
         `touch-none` a phone treats the drag as a scroll. */
      className={`relative shrink-0 group/tier outline-none touch-none ${
        isDragging ? "opacity-25" : ""
      }`}
      style={{ width, height: TIER_TILE_HEIGHT }}
    >
      <div
        className="relative w-full h-full overflow-hidden squircle"
        style={{
          borderRadius: 10,
          boxShadow: isSelected
            ? "0 0 0 2px var(--color-primary)"
            : isOver
              ? "0 0 0 2px var(--color-primary), 0 0 0 6px color-mix(in srgb, var(--color-primary) 22%, transparent)"
              : "inset 0 0 0 0.5px var(--material-hairline)",
        }}
      >
        <RemoteImage
          src={item.imageSrc!}
          alt=""
          decoding="async"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={imageStyle}
        />

        <button
          type="button"
          aria-label="Item actions"
          onClick={openMenu}
          className="absolute top-1 right-1 z-10 flex items-center justify-center w-6 h-6
                     media-scrim squircle hover:brightness-125 active:scale-95
                     transition-transform duration-150 affordance touch-target"
          style={{ borderRadius: 7 }}
        >
          <MoreHorizontal size={13} strokeWidth={2.5} />
        </button>

        {dropPulse > 0 && (
          <span
            key={dropPulse}
            aria-hidden
            className="drop-land absolute inset-0 z-30 pointer-events-none"
            style={{ borderRadius: 10 }}
          />
        )}

        {isAdjusting && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-between p-1 select-none touch-none cursor-move"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            <span className="media-scrim text-caption-2 font-semibold px-2 py-0.5 rounded-full">
              Move
            </span>
            <div className="flex gap-1.5 mb-1">
              <button
                type="button"
                aria-label="Cancel"
                onClick={(e) => {
                  e.stopPropagation();
                  stopAdjusting();
                }}
                className="flex items-center justify-center w-7 h-7 media-scrim rounded-full"
              >
                <X size={13} />
              </button>
              <button
                type="button"
                aria-label="Save"
                onClick={(e) => {
                  e.stopPropagation();
                  saveAdjustments();
                  clearInteraction();
                }}
                className="flex items-center justify-center w-7 h-7 rounded-full text-on-accent"
                style={{ background: "var(--color-primary)" }}
              >
                <Check size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      <PopoverMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        actions={filledImageActions({
          onReplace: triggerPicker,
          onAdjust: startAdjusting,
          onDownload: () =>
            void downloadImage(item.imageSrc!, `tier-${idx + 1}.jpg`),
          onReturnToLibrary: () => {
            handleItemTransfer(
              { type: "tier", rowId, itemId: item.id },
              { type: "inbox" }
            );
            clearInteraction();
          },
          onRemove: () => {
            handleTierItemRemove(rowId, item.id);
            clearInteraction();
          },
        })}
        triggerPoint={anchor}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
});

/**
 * The droppable lane a tier row's items sit in. Dropping anywhere in the lane
 * appends to that tier (`index: -1`).
 */
export const TierRail: React.FC<{
  rowId: string;
  children: React.ReactNode;
  justify?: "left" | "center" | "right";
}> = ({ rowId, children, justify }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `tier-row-body-${rowId}`,
    data: { type: "tier-cell", rowId, index: -1 },
  });

  const { handleInteraction } = useCellInteraction({
    type: "tier-item",
    index: -1,
    rowId,
  });

  const justifyClass =
    justify === "left"
      ? "justify-start"
      : justify === "right"
        ? "justify-end"
        : "justify-center";

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => handleInteraction(e.clientX, e.clientY, e.target as HTMLElement)}
      className={`relative flex-1 min-w-0 flex flex-wrap content-start items-start gap-1.5 p-2
                  transition-colors duration-150 ${justifyClass}`}
      style={{
        minHeight: TIER_TILE_HEIGHT + 16,
        backgroundColor: isOver
          ? "color-mix(in srgb, var(--color-primary) 10%, transparent)"
          : undefined,
      }}
    >
      {children}
    </div>
  );
};
