import React, { useState } from "react";
import { Check, X } from "lucide-react";
import type { InboxItem } from "@/types";
import { getProxiedImageUrl } from "@/utils/imageProxy";

export interface InboxItemCardProps {
  item: InboxItem;
  isUsed: boolean;
  isSelected: boolean;
  isAllView: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onItemClick: (e: React.MouseEvent, itemId: string) => void;
  onDeleteItem: (item: InboxItem) => void;
}

export const InboxItemCard: React.FC<InboxItemCardProps> = ({
  item,
  isUsed,
  isSelected,
  isAllView,
  onDragStart,
  onDragEnd,
  onItemClick,
  onDeleteItem,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        onDragStart(e, item.id);
        setTimeout(() => setIsDragging(true), 0);
      }}
      onDragEnd={() => {
        setIsDragging(false);
        onDragEnd();
      }}
      onClick={(e) => onItemClick(e, item.id)}
      className={`
            relative group shrink-0 w-28 h-40 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-200 ease-out
            ${
              isUsed
                ? "opacity-40 grayscale hover:opacity-60"
                : "hover:ring-2 hover:ring-blue-500 hover:scale-105 shadow-md"
            }
            ${isSelected ? "ring-2 ring-blue-500 scale-95 opacity-90 shadow-lg" : ""}
            ${isDragging ? "opacity-50 scale-95 ring-2 ring-green-500 drop-shadow-lg" : ""}
            `}
    >
      <img
        src={getProxiedImageUrl(item.imageSrc)}
        alt="Item"
        className="w-full h-full object-cover pointer-events-none bg-[#2c2c2e]"
        referrerPolicy="no-referrer"
      />

      {isUsed && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none backdrop-blur-[2px]">
          <div className="bg-white/20 rounded-full p-2 backdrop-blur-md">
            <Check
              size={24}
              className="text-white drop-shadow-md"
              strokeWidth={2.5}
            />
          </div>
        </div>
      )}

      {!isAllView && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteItem(item);
          }}
          className="absolute top-2 right-2 p-1.5 bg-black/40 text-white rounded-full hover:bg-red-500 transition-all z-10 backdrop-blur-md group-hover:opacity-100 shadow-sm"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};
