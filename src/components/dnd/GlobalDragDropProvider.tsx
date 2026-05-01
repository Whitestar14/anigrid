import React, { ReactNode, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragMoveEvent,
  DragOverlay,
  pointerWithin,
  useDndContext,
} from '@dnd-kit/core';
import { useStore } from '@/store/useStore';
import { getProxiedImageUrl } from '@/utils/imageProxy';

const CustomDragOverlay = () => {
  const { active, activeNodeRect } = useDndContext();
  
  if (!active || !active.data.current?.imageSrc) return null;
  
  return (
    <div 
      className="overflow-hidden shadow-2xl opacity-80 transition-none"
      style={{
        width: activeNodeRect?.width ?? 96,
        height: activeNodeRect?.height ?? 96,
        borderRadius: "inherit"
      }}
    >
      <img 
        src={getProxiedImageUrl(active.data.current.imageSrc)} 
        alt="Drag Overlay" 
        className="w-full h-full object-cover" 
        referrerPolicy="no-referrer" 
      />
    </div>
  );
};

export const GlobalDragDropProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    if (event.active.data.current?.type === "inbox-item") {
      useStore.getState().setIsDraggingFromDock(true);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    useStore.getState().setIsDraggingFromDock(false);

    const { active, over } = event;
    if (!over) return;
    
    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;
    
    const store = useStore.getState();

    // From Inbox to Cell
    if (activeType === "inbox-item" && overType === "cell") {
      const idx = over.data.current?.index;
      const itemId = active.data.current?.id;
      const colId = active.data.current?.collectionId;
      if (idx !== undefined && itemId && colId) {
        store.handleInboxDrop(itemId, colId, idx);
      }
    }
    
    // From Cell to Cell
    if (activeType === "cell" && overType === "cell") {
      const fromIdx = active.data.current?.index;
      const toIdx = over.data.current?.index;
      if (fromIdx !== undefined && toIdx !== undefined && fromIdx !== toIdx) {
        store.handleSwapCells(fromIdx, toIdx);
      }
    }
    
    // From Cell to Inbox (remove/move to inbox)
    if (activeType === "cell" && overType === "inbox-trash") {
      const fromIdx = active.data.current?.index;
      if (fromIdx !== undefined) {
        store.handleMoveToInbox(fromIdx);
      }
    }

    // From Inbox to TierList
    if (activeType === "inbox-item" && overType === "tier-cell") {
      const rowId = over.data.current?.rowId;
      const idx = over.data.current?.index;
      const itemId = active.data.current?.id;
      const colId = active.data.current?.collectionId;
      if (rowId && idx !== undefined && itemId && colId) {
        store.handleInboxDropToTier(itemId, colId, rowId, idx);
      }
    }

    // From TierItem to TierCell (internal move)
    if (activeType === "tier-item" && overType === "tier-cell") {
      const srcRowId = active.data.current?.rowId;
      const srcItemId = active.data.current?.id;
      const tgtRowId = over.data.current?.rowId;
      const tgtIdx = over.data.current?.index;
      if (srcRowId && srcItemId && tgtRowId && tgtIdx !== undefined) {
        store.handleInternalTierMove(srcRowId, srcItemId, tgtRowId, tgtIdx);
      }
    }

    // From TierItem to Inbox
    if (activeType === "tier-item" && overType === "inbox-trash") {
      const srcRowId = active.data.current?.rowId;
      const srcItemId = active.data.current?.id;
      if (srcRowId && srcItemId) {
        store.handleTierMoveToInbox(srcRowId, srcItemId);
      }
    }
  };

  // We explicitly disable scale adjustments via dropAnimation
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        <CustomDragOverlay />
      </DragOverlay>
    </DndContext>
  );
};
