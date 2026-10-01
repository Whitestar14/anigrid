import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Upload, Check, X, MoreHorizontal } from "lucide-react";
import { CellData } from "@/types";
import { useStore } from "@/store/useStore";
import { selectActiveRank } from "@/store/selectors";
import { UrlInputModal } from "@/components/ui/UrlInputModal";
import { PopoverMenu } from "@/components/ui/PopoverMenu";
import {
  filledImageActions,
  emptyImageActions,
} from "@/components/ui/imageActions";
import { downloadImage } from "@/utils/imageProxy";
import { Slider } from "@/components/ui/Slider";
import { RemoteImage } from "@/components/ui/RemoteImage";
import { usePanZoom } from "@/hooks/usePanZoom";
import { useCellInteraction } from "@/hooks/useCellInteraction";
import { useCellMediaUpload } from "@/hooks/useCellMediaUpload";
import { useDropPulse } from "@/state/dragState";
import { widthForHeight } from "@/utils/ui";

const THUMB_HEIGHT = 56;

export interface ListRowProps {
  index: number;
  data: CellData;
}

export const ListRow = React.memo(function ListRow({
  index,
  data,
}: ListRowProps) {
  const rank = useStore(selectActiveRank);
  const handleCellClear = useStore((s) => s.handleCellClear);
  const handleUpdateCell = useStore((s) => s.handleUpdateCell);
  const handleItemTransfer = useStore((s) => s.handleItemTransfer);
  const handleCellUpload = useStore((s) => s.handleCellUpload);

  const rowRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
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

  const [localText, setLocalText] = useState(data?.textLabel || "");
  useEffect(() => {
    setLocalText(data?.textLabel || "");
  }, [data?.textLabel]);

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
      zoom: data?.zoom,
      posX: data?.objectPosition
        ? parseInt(data.objectPosition.split(" ")[0])
        : 50,
      posY: data?.objectPosition
        ? parseInt(data.objectPosition.split(" ")[1])
        : 50,
    },
    imageContainerRef,
    (state) =>
      handleUpdateCell(index, {
        zoom: state.zoom,
        objectPosition: `${state.posX}% ${state.posY}%`,
      })
  );

  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({
      id: data?.id || `cell-${index}`,
      data: {
        type: "cell",
        index,
        imageSrc: data?.imageSrc,
        textLabel: data?.textLabel,
        rating: data?.rating,
        width: rowRef.current?.offsetWidth,
        isRow: true,
      },
      disabled: isAdjusting,
    });

  const setRowRefs = useCallback(
    (node: HTMLDivElement | null) => {
      (rowRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      setNodeRef(node);
    },
    [setNodeRef]
  );

  const dropPulse = useDropPulse(data?.id ?? `cell-${index}`);

  const openMenu = useCallback(
    (e: React.MouseEvent, target?: HTMLElement | null) => {
      e.stopPropagation();
      e.preventDefault();
      const rect = (target ?? rowRef.current)?.getBoundingClientRect();
      if (rect) setAnchor({ x: rect.left + rect.width / 2, y: rect.top + 12 });
      setIsMenuOpen(true);
    },
    []
  );

  if (!data || !rank) return null;

  const aspectRatio = rank.aspectRatio || "3:4";
  const radius = rank.borderRadius ?? 12;
  const showNumbers = rank.showNumbers ?? true;
  const isCard = (rank.style || "card") === "card";
  const borderless = rank.borderless ?? false;
  const thumbWidth = widthForHeight(aspectRatio, THUMB_HEIGHT);

  const actions = data.imageSrc
    ? filledImageActions({
        onReplace: triggerPicker,
        onAdjust: startAdjusting,
        onDownload: () =>
          void downloadImage(
            data.imageSrc!,
            `${rank.title.replace(/\s+/g, "-").toLowerCase() || "image"}-${
              index + 1
            }.jpg`
          ),
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
      ref={setRowRefs}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        borderRadius: isCard ? radius : undefined,
        // Capped so a long list still finishes settling promptly.
        "--enter-delay": `${Math.min(index, 14) * 26}ms`,
      } as React.CSSProperties}
      onClick={(e) => {
        if (isAdjusting) return;
        handleInteraction(e.clientX, e.clientY, e.target as HTMLElement);
      }}
      className={`group item-enter relative flex items-center gap-3 px-3 py-2.5
        ${isCard ? "bg-surface" : `bg-surface ${index > 0 ? "border-t border-border" : ""}`}
        ${!isCard && borderless ? "border-t-0" : ""}
        ${isDragging ? "opacity-25 z-0" : "z-10"}
        ${isOver ? "z-20" : ""}
        ${isSelected ? "bg-primary/5" : ""}
        transition-colors duration-150
      `}
    >
      {/* Selection / drop indication drawn as an inset ring so the row never
          reflows when it lights up. */}
      {(isSelected || isOver) && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            boxShadow: `inset 0 0 0 ${
              isOver ? 2 : 1.5
            }px color-mix(in srgb, var(--color-primary) ${
              isOver ? 100 : 55
            }%, transparent)`,
            borderRadius: isCard ? radius : undefined,
          }}
        />
      )}

      {/* Landing pulse — the row versions of the grid tile's drop feedback. */}
      {dropPulse > 0 && (
        <span
          key={dropPulse}
          aria-hidden
          className="drop-land pointer-events-none absolute inset-0 z-30"
          style={{ borderRadius: isCard ? radius : undefined }}
        />
      )}

      {/* ── Drag handle ─────────────────────────────────────────────── */}
      <div
        {...attributes}
        {...listeners}
        className="shrink-0 flex items-center gap-1 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical
          size={16}
          className="text-faint group-hover:text-muted transition-colors"
        />
        {showNumbers && (
          <span className="hidden sm:block w-6 text-center text-footnote font-semibold text-muted tabular-nums select-none">
            {index + 1}
          </span>
        )}
      </div>

      {/* ── Thumbnail ───────────────────────────────────────────────── */}
      <div
        ref={imageContainerRef}
        className="relative shrink-0"
        style={{ width: thumbWidth, height: THUMB_HEIGHT }}
      >
        {data.imageSrc ? (
          <div
            className="w-full h-full relative overflow-hidden cursor-pointer squircle"
            style={{
              borderRadius: radius,
              boxShadow: isAdjusting
                ? "0 0 0 2px var(--color-primary)"
                : "inset 0 0 0 0.5px var(--material-hairline)",
            }}
          >
            <RemoteImage
              src={data.imageSrc}
              alt=""
              decoding="async"
              className="w-full h-full object-cover pointer-events-none"
              style={imageStyle}
            />

            {isAdjusting && (
              <div
                className="absolute inset-0 z-30 flex flex-col items-center justify-between p-1 select-none touch-none cursor-move"
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
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label="Cancel"
                    onClick={(e) => {
                      e.stopPropagation();
                      stopAdjusting();
                    }}
                    className="flex items-center justify-center w-6 h-6 media-scrim rounded-full"
                  >
                    <X size={12} />
                  </button>
                  <button
                    type="button"
                    aria-label="Save"
                    onClick={(e) => {
                      e.stopPropagation();
                      saveAdjustments();
                      clearInteraction();
                    }}
                    className="flex items-center justify-center w-6 h-6 rounded-full text-on-accent"
                    style={{ background: "var(--color-primary)" }}
                  >
                    <Check size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            aria-label={`Add image to row ${index + 1}`}
            onClick={(e) => openMenu(e, e.currentTarget)}
            className="w-full h-full flex items-center justify-center squircle
                       bg-surface-secondary text-muted hover:text-text hover:bg-hover
                       transition-colors duration-150"
            style={{ borderRadius: radius }}
          >
            <Upload size={16} strokeWidth={2.2} />
          </button>
        )}
      </div>

      {/* ── Title ───────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <input
          type="text"
          aria-label={`Title for row ${index + 1}`}
          placeholder="Untitled"
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          onBlur={() => {
            if (localText !== (data.textLabel || "")) {
              handleUpdateCell(index, { textLabel: localText });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-transparent text-callout font-medium text-text truncate
                     placeholder:text-faint outline-none border-none p-0"
        />
      </div>

      {/* ── Score ───────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-2.5">
        <div className="w-24 sm:w-36">
          <Slider
            aria-label={`Score for row ${index + 1}`}
            min={0}
            max={10}
            step={1}
            value={data.rating || 0}
            onChange={(v) => handleUpdateCell(index, { rating: v })}
          />
        </div>
        <span
          className={`w-9 text-right text-caption-1 font-semibold tabular-nums ${
            data.rating ? "text-text" : "text-faint"
          }`}
        >
          {data.rating ? data.rating : "—"}
        </span>
      </div>

      {/* ── Row menu ────────────────────────────────────────────────── */}
      <button
        type="button"
        aria-label={`Row ${index + 1} options`}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        onClick={(e) => openMenu(e, e.currentTarget)}
        className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full
                   text-muted hover:text-text hover:bg-hover transition-colors
                   affordance touch-target"
      >
        <MoreHorizontal size={17} />
      </button>

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
          handleCellUpload(index, url);
          clearInteraction();
        }}
      />
    </div>
  );
});
