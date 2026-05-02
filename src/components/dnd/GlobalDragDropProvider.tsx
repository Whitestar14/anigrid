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
import { selectActiveRank } from '@/store/selectors';
import { LIST_ASPECT_MAP, ASPECT_MAP } from '@/utils/ui';
import { Star } from 'lucide-react';

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
  const rank = useStore(selectActiveRank);
  if (!active?.data.current?.imageSrc || !rank) return null;

  const data = active.data.current;
  const rankStyle = rank.style || 'card';

  if (data.isRow) {
    return (
      <div 
        className={`
          flex items-center gap-4 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 pointer-events-none
          ${rankStyle === 'card' ? 'bg-surface rounded-2xl' : 'bg-[#1c1c1e]'}
        `}
        style={{ width: data.width || '100%', opacity: 0.9 }}
      >
        <div className={`shrink-0 overflow-hidden border border-white/5 ${LIST_ASPECT_MAP[rank.aspectRatio || '3:4']}`}>
          <img
            src={getProxiedImageUrl(data.imageSrc)}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-lg sm:text-xl truncate">
            {data.textLabel || ''}
          </div>
          {data.rating && (
            <div className="flex items-center gap-1 text-xs font-bold text-yellow-500/80">
              <Star size={10} className="fill-yellow-500" />
              <span>{data.rating}/10</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (data.type === DRAG_TYPE.TIER_ITEM) {
    return (
      <div
        className="overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-lg pointer-events-none border border-white/20 bg-[#1c1c1e]"
        style={{ 
          width: data.width || 96, 
          height: data.height || 128,
          opacity: 0.9
        }}
      >
        <img
          src={getProxiedImageUrl(data.imageSrc)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-xl pointer-events-none border border-white/20 ${ASPECT_MAP[rank.aspectRatio || '3:4']}`}
      style={{ 
        width: data.width || 120, 
        opacity: 0.9
      }}
    >
      <img
        src={getProxiedImageUrl(data.imageSrc)}
        alt="Drag Overlay"
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

/* ─── Provider ─────────────────────────────────────────────────────── */
export const GlobalDragDropProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 3 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 150, tolerance: 8 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  /* ── onDragStart ────────────────────────────────────────────────── */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeType = event.active.data.current?.type;
    if (activeType === DRAG_TYPE.INBOX_ITEM || activeType === DRAG_TYPE.SEARCH_ITEM) {
      useStore.getState().setIsDraggingFromDock(true);
    }
  }, []);

  /* ── onDragEnd ──────────────────────────────────────────────────── */
  const handleDragEnd = useCallback((event: DragEndEvent) => {
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
        if (active.data.current?.isRow) {
          store.handleReorderCells(fromIdx, toIdx);
        } else {
          store.handleSwapCells(fromIdx, toIdx);
        }
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

  /* ── onDragCancel ────────────────────────────────────────────────── */
  const handleDragCancel = useCallback(() => {
    useStore.getState().setIsDraggingFromDock(false);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        <CustomDragOverlay />
      </DragOverlay>
    </DndContext>
  );
};
