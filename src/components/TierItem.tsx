import React, { useRef } from "react";
import { motion } from "motion/react";
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CellData } from "@/types";
import { PopoverMenu } from "./ui/PopoverMenu";
import { useCellInteraction } from "@/hooks/useCellInteraction";
import { usePanZoom } from "@/hooks/usePanZoom";
import { X, Crop, Check } from "lucide-react";
import { getProxiedImageUrl } from "@/utils/imageProxy";
import { TIER_ASPECT_MAP } from "@/utils/ui";
import { useStore } from "@/store/useStore";

export const TierItem = React.memo(function TierItem({
  rowId,
  idx,
  item,
  aspectRatio,
}: {
  rowId: string;
  idx: number;
  item: CellData;
  aspectRatio: string;
}) {
  const onMoveToInbox = useStore(s => s.handleTierMoveToInbox);
  const onUpdateItem = useStore(s => s.handleUpdateTierItem);

  const tierRef = useRef<HTMLDivElement>(null);

  const { isSelected, localClickPoint, handleInteraction, clearInteraction } = useCellInteraction({
    type: 'tier-item',
    index: idx,
    rowId,
    itemId: item.id
  });

  const {
    isAdjusting,
    setIsAdjustDragging,
    zoom,
    posX,
    posY,
    handleWheel,
    startAdjusting,
    stopAdjusting,
    saveAdjustments
  } = usePanZoom(
    { zoom: item?.zoom, posX: item?.objectPosition ? parseInt(item.objectPosition.split(" ")[0]) : 50, posY: item?.objectPosition ? parseInt(item.objectPosition.split(" ")[1]) : 50 },
    tierRef,
    (state) => onUpdateItem(rowId, item.id, { zoom: state.zoom, objectPosition: `${state.posX}% ${state.posY}%` })
  );

  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: `tier-drop-${rowId}-${idx}`,
    data: { type: 'tier-cell', rowId, index: idx }
  });

  const { isDragging, setNodeRef: setDraggableRef, attributes, listeners } = useDraggable({
    id: `tier-drag-${rowId}-${item?.id || idx}`,
    data: {
      type: 'tier-item',
      rowId,
      id: item?.id,
      imageSrc: item?.imageSrc,
      width: tierRef.current?.offsetWidth,
      aspectRatio: aspectRatio.replace(':', '/')
    },
    disabled: !item?.imageSrc || isAdjusting
  });

  const setRefs = (node: HTMLDivElement | null) => {
    (tierRef as any).current = node;
    setDroppableRef(node);
    if (!isAdjusting && item?.imageSrc) {
      setDraggableRef(node);
    } else {
      setDraggableRef(null);
    }
  };

  const objectPosStyle: React.CSSProperties = {
    objectPosition: isAdjusting ? `${posX}% ${posY}%` : item?.objectPosition || "center",
    transform: `scale(${isAdjusting ? zoom : item?.zoom || 1})`,
    transformOrigin: "center",
  };

  if (!item) return null;

  return (
    <motion.div
      ref={setRefs}
      layout={!isDragging}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className={`relative group/item ${isDragging ? "opacity-40 scale-95 grayscale" : ""} ${isOver ? "focus-ring bg-primary/20 scale-105 z-20 shadow-2xl" : ""}`}
      onClick={(e) => {
        if (isAdjusting) return;
        handleInteraction(e.clientX, e.clientY, e.target as HTMLElement);
      }}
      {...attributes}
      {...listeners}
    >
      <div className={`${TIER_ASPECT_MAP[aspectRatio || "3:4"]} relative cursor-grab active:cursor-grabbing overflow-hidden select-none bg-surface-secondary`}>
        <img
          src={getProxiedImageUrl(item.imageSrc!)}
          className="w-full h-full object-cover pointer-events-none transition-all duration-200"
          style={objectPosStyle}
        />
        {isAdjusting && (
          <div className="absolute inset-0 bg-surface/50 flex flex-col items-center justify-between p-1 z-30" onMouseDown={(e) => { e.stopPropagation(); setIsAdjustDragging(true); }} onWheel={handleWheel}>
            <div className="bg-surface-elevated text-text text-[8px] uppercase font-bold px-2 py-0.5 rounded-full">Pan & Zoom</div>
            <div className="flex gap-1 mb-1">
              <button onClick={(e) => { e.stopPropagation(); stopAdjusting(); }} className="p-1.5 bg-surface-elevated rounded-full text-text"><X size={12} /></button>
              <button onClick={(e) => { e.stopPropagation(); saveAdjustments(); clearInteraction(); }} className="p-1.5 bg-primary rounded-full text-white"><Check size={12} /></button>
            </div>
          </div>
        )}
      </div>
      {isSelected && !isAdjusting && (
        <PopoverMenu
          isOpen={true}
          onClose={clearInteraction}
          triggerPoint={localClickPoint}
          actions={[
            { label: 'Adjust', icon: Crop, onClick: startAdjusting },
            { label: 'Remove', icon: X, onClick: () => { onMoveToInbox(rowId, idx); clearInteraction(); }, variant: 'danger' }
          ]}
        />
      )}
    </motion.div>
  );
});

export const TierRowWrapper: React.FC<{ rowId: string; children: React.ReactNode; justify?: "left" | "center" | "right" }> = ({ rowId, children, justify }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `tier-row-body-${rowId}`,
    data: { type: 'tier-cell', rowId, index: -1 }
  });

  const { handleInteraction } = useCellInteraction({
    type: 'tier-item',
    index: -1,
    rowId,
  });

  const justifyClass = justify === 'left' ? 'justify-start text-left' : 
                       justify === 'right' ? 'justify-end text-right' : 
                       'justify-center text-center';

  return (
    <div ref={setNodeRef} className={`relative flex-1 flex flex-wrap content-start ${justifyClass} items-start min-h-[6rem] transition-all bg-surface ${isOver ? "bg-primary/5 focus-ring scale-[1.01] z-10 shadow-inner" : ""}`} onClick={(e) => handleInteraction(e.clientX, e.clientY, e.target as HTMLElement)}>
      {children}
    </div>
  );
};
