import React, { ReactNode, useState, useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  pointerWithin,
  useDndContext,
} from '@dnd-kit/core';
import { useStore } from '@/store/useStore';
import { getProxiedImageUrl } from '@/utils/imageProxy';

/* ─── drag type constants ──────────────────────────────────────────── */
export const DRAG_TYPE = {
  CELL: 'cell',
  INBOX_ITEM: 'inbox-item',
  SEARCH_ITEM: 'search-item',
  TIER_ITEM: 'tier-item',
} as const;

export const DROP_TYPE = {
  CELL: 'cell',
  TIER_CELL: 'tier-cell',
  DOCK: 'inbox-trash',
} as const;

/* ─── Overlay ──────────────────────────────────────────────────────── */
const CustomDragOverlay = () => {
  const { active } = useDndContext();
  if (!active?.data.current?.imageSrc) return null;

  return (
    <div
      className="overflow-hidden shadow-2xl opacity-80 rounded-xl pointer-events-none"
      style={{ width: 96, height: 128 }}
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

/* ─── Provider ─────────────────────────────────────────────────────── */
export const GlobalDragDropProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [_activeId, setActiveId] = useState<string | null>(null);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 8 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  /* ── onDragStart ────────────────────────────────────────────────── */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);

    const activeType = event.active.data.current?.type;
    if (activeType === DRAG_TYPE.INBOX_ITEM || activeType === DRAG_TYPE.SEARCH_ITEM) {
      useStore.getState().setIsDraggingFromDock(true);
    }
  }, []);

  /* ── onDragEnd ──────────────────────────────────────────────────── */
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    const wasDockDrag = useStore.getState().inbox.isDraggingFromDock;
    useStore.getState().setIsDraggingFromDock(false);

    const { active, over } = event;
    if (!over) return;

    const aType = active.data.current?.type;
    const oType = over.data.current?.type;
    const store = useStore.getState();

    /* ── Inbox Item → Cell ──────────────────────────────── */
    if (aType === DRAG_TYPE.INBOX_ITEM && oType === DROP_TYPE.CELL) {
      const idx = over.data.current?.index;
      const itemId = active.data.current?.id;
      const colId = active.data.current?.collectionId;
      if (idx !== undefined && itemId && colId) {
        store.handleInboxDrop(itemId, colId, idx);
      }
    }

    /* ── Search Item → Cell ─────────────────────────────── */
    if (aType === DRAG_TYPE.SEARCH_ITEM && oType === DROP_TYPE.CELL) {
      const idx = over.data.current?.index;
      const imageSrc = active.data.current?.imageSrc;
      if (idx !== undefined && imageSrc) {
        store.handleSearchDrop(imageSrc, idx);
      }
    }

    /* ── Cell → Cell (swap) ─────────────────────────────── */
    if (aType === DRAG_TYPE.CELL && oType === DROP_TYPE.CELL) {
      const fromIdx = active.data.current?.index;
      const toIdx = over.data.current?.index;
      if (fromIdx !== undefined && toIdx !== undefined && fromIdx !== toIdx) {
        store.handleSwapCells(fromIdx, toIdx);
      }
    }

    /* ── Cell → Dock (return to inbox) ──────────────────── */
    if (aType === DRAG_TYPE.CELL && oType === DROP_TYPE.DOCK) {
      const fromIdx = active.data.current?.index;
      if (fromIdx !== undefined) {
        store.handleMoveToInbox(fromIdx);
      }
    }

    /* ── Inbox Item → Tier ──────────────────────────────── */
    if (aType === DRAG_TYPE.INBOX_ITEM && oType === DROP_TYPE.TIER_CELL) {
      const rowId = over.data.current?.rowId;
      const idx = over.data.current?.index ?? -1;
      const itemId = active.data.current?.id;
      const colId = active.data.current?.collectionId;
      if (rowId && itemId && colId) {
        store.handleInboxDropToTier(itemId, colId, rowId, idx);
      }
    }

    /* ── Search Item → Tier ─────────────────────────────── */
    if (aType === DRAG_TYPE.SEARCH_ITEM && oType === DROP_TYPE.TIER_CELL) {
      const rowId = over.data.current?.rowId;
      const idx = over.data.current?.index ?? -1;
      const imageSrc = active.data.current?.imageSrc;
      if (rowId && imageSrc) {
        store.handleSearchDropToTier(imageSrc, rowId, idx);
      }
    }

    /* ── Tier Item → Tier Cell (internal move) ──────────── */
    if (aType === DRAG_TYPE.TIER_ITEM && oType === DROP_TYPE.TIER_CELL) {
      const srcRowId = active.data.current?.rowId;
      const srcItemId = active.data.current?.id;
      const tgtRowId = over.data.current?.rowId;
      const tgtIdx = over.data.current?.index ?? -1;
      if (srcRowId && srcItemId && tgtRowId) {
        store.handleInternalTierMove(srcRowId, srcItemId, tgtRowId, tgtIdx);
      }
    }

    /* ── Tier Item → Dock (return to inbox) ─────────────── */
    if (aType === DRAG_TYPE.TIER_ITEM && oType === DROP_TYPE.DOCK) {
      const srcRowId = active.data.current?.rowId;
      const srcItemId = active.data.current?.id;
      if (srcRowId && srcItemId) {
        store.handleTierMoveToInbox(srcRowId, srcItemId);
      }
    }

    /* ── Tier Item → Cell ──────────────────────────────── */
    if (aType === DRAG_TYPE.TIER_ITEM && oType === DROP_TYPE.CELL) {
      const srcRowId = active.data.current?.rowId;
      const srcItemId = active.data.current?.id;
      const imageSrc = active.data.current?.imageSrc;
      const idx = over.data.current?.index;
      if (srcRowId && srcItemId && imageSrc && idx !== undefined) {
        store.handleSearchDrop(imageSrc, idx);
        store.handleTierMoveToInbox(srcRowId, srcItemId);
      }
    }

    /* ── Cell → Tier ───────────────────────────────────── */
    if (aType === DRAG_TYPE.CELL && oType === DROP_TYPE.TIER_CELL) {
      const fromIdx = active.data.current?.index;
      const imageSrc = active.data.current?.imageSrc;
      const rowId = over.data.current?.rowId;
      const tgtIdx = over.data.current?.index ?? -1;
      if (fromIdx !== undefined && imageSrc && rowId) {
        store.handleSearchDropToTier(imageSrc, rowId, tgtIdx);
        store.handleCellClear(fromIdx);
      }
    }
  }, []);

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
