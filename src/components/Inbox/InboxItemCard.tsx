import React from "react";
import { RotateCcw, X } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import type { InboxItem } from "@/types";
import { RemoteImage } from "@/components/ui/RemoteImage";

export interface InboxItemCardProps {
  item: InboxItem;
  collectionId: string;
  isUsed: boolean;
  isSelected: boolean;
  isAllView: boolean;
  onItemClick: (e: React.MouseEvent, itemId: string) => void;
  onDeleteItem: (item: InboxItem) => void;
  onRecall: (imageSrc: string) => void;
}

export const InboxItemCard = React.memo<InboxItemCardProps>(({
  item,
  collectionId,
  isUsed,
  isSelected,
  isAllView,
  onItemClick,
  onDeleteItem,
  onRecall,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `inbox-item-${item.id}`,
    data: { type: "inbox-item", id: item.id, collectionId, imageSrc: item.imageSrc },
  });

  return (
    /* No `touch-none`: it made the whole stash rail unscrollable by swipe, since
       `touch-action: none` hands every gesture to dnd-kit. The press-and-hold
       delay on the drag sensor is what separates dragging from scrolling. */
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => onItemClick(e, item.id)}
      className={`
        relative group shrink-0 w-28 h-40 rounded-tile overflow-hidden
        cursor-grab active:cursor-grabbing transition-transform duration-150 ease-out
        ${
          isUsed
            ? "opacity-55 hover:opacity-85"
            : "ring-2 ring-transparent hover:ring-primary/60 hover:scale-105"
        }
        ${isSelected ? "ring-2 ring-primary scale-95 opacity-100" : ""}
        ${isDragging ? "opacity-50 scale-95 ring-2 ring-accent-green" : ""}
      `}
    >
      {/* Dock thumbnails are the most visible failure point in the app, so they
          get the full candidate walk: configured proxy, deployed proxy, then the
          origin. Previously this was a single proxy URL, which meant every
          thumbnail in the dock vanished while the local backend was not
          running. */}
      <RemoteImage
        src={item.imageSrc}
        alt="Item"
        loading="lazy"
        decoding="async"
        className={`w-full h-full object-cover pointer-events-none bg-surface-secondary ${
          isUsed ? "grayscale" : ""
        }`}
      />

      {isUsed && (
        <div className="absolute inset-x-0 bottom-0 p-1.5 flex justify-center animate-in fade-in duration-150">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRecall(item.imageSrc);
            }}
            title="Return to stash (removes it from the board)"
            className="flex items-center justify-center gap-1.5 h-7 px-3 rounded-full
                       material-thin text-caption-1 font-semibold text-text
                       hover:bg-hover active:scale-95 transition-[transform,background-color]"
          >
            <RotateCcw size={12} strokeWidth={2.6} />
            Recall
          </button>
        </div>
      )}

      {!isAllView && !isUsed && (
        <button
          type="button"
          aria-label="Remove from stash"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteItem(item);
          }}
          className="absolute top-1.5 right-1.5 grid place-items-center w-6 h-6
                     material-thin squircle text-text hover:text-destructive
                     transition-colors z-10 opacity-0 group-hover:opacity-100
                     focus-visible:opacity-100 touch-target"
          style={{ borderRadius: 8 }}
        >
          <X size={13} strokeWidth={2.6} />
        </button>
      )}
    </div>
  );
});

InboxItemCard.displayName = "InboxItemCard";
