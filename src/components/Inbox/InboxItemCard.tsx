import React from "react";
import { RotateCcw, X } from "lucide-react";
import { useDraggable } from '@dnd-kit/core';
import type { InboxItem } from "@/types";
import { getProxiedImageUrl } from "@/utils/imageProxy";

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
    data: { type: 'inbox-item', id: item.id, collectionId, imageSrc: item.imageSrc },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => onItemClick(e, item.id)}
      className={`
            relative group shrink-0 w-28 h-40 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-200 ease-out touch-none
            ${
              isUsed
                ? "opacity-60 hover:opacity-80"
                : "hover:ring-2 hover:ring-blue-500 hover:scale-105 shadow-md"
            }
            ${isSelected ? "ring-2 ring-blue-500 scale-95 opacity-100 shadow-lg" : ""}
            ${isDragging ? "opacity-50 scale-95 ring-2 ring-green-500 drop-shadow-lg" : ""}
            `}
    >
      <img
        src={getProxiedImageUrl(item.imageSrc)}
        alt="Item"
        className={`w-full h-full object-cover pointer-events-none bg-surface-secondary ${isUsed ? 'grayscale' : ''}`}
        referrerPolicy="no-referrer"
      />

      {isUsed && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-2 animate-in fade-in duration-150 pointer-events-none">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRecall(item.imageSrc);
            }}
            title="Recall to Stash"
            className="flex items-center justify-center p-3 bg-surface/90 backdrop-blur-md rounded-full border border-border shadow-lg transition-transform hover:scale-110 active:scale-95 pointer-events-auto text-primary"
          >
            <RotateCcw
              size={16}
              strokeWidth={2.5}
            />
          </button>
        </div>
      )}

      {(!isAllView && !isUsed) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteItem(item);
          }}
          className="absolute top-2 right-2 p-1.5 bg-surface-elevated text-text border border-[rgba(255,255,255,0.1)] dark:border-[rgba(0,0,0,0.1)] shadow-md rounded-full hover:bg-red-500 hover:text-white transition-all z-10 backdrop-blur-md opacity-0 group-hover:opacity-100"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
});
