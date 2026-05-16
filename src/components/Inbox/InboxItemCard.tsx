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
        <div className="absolute inset-0 bg-black/10 flex flex-col items-center justify-end p-2 animate-in fade-in duration-150 pointer-events-none">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRecall(item.imageSrc);
            }}
            className="group/recall flex items-center justify-center gap-1.5 w-full py-2 bg-surface/90 backdrop-blur-xl rounded-xl border border-border shadow-lg transition-all transform hover:scale-105 active:scale-95 pointer-events-auto"
          >
            <RotateCcw
              size={12}
              className="text-text"
              strokeWidth={2.5}
            />
            <span className="text-[10px] font-bold uppercase tracking-widest text-text">
              Recall
            </span>
          </button>
        </div>
      )}

      {!isAllView && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteItem(item);
          }}
          className="absolute top-2 right-2 p-1.5 bg-surface-elevated text-text rounded-full hover:bg-red-500 transition-all z-10 backdrop-blur-md group-hover:opacity-100 shadow-sm"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
});
