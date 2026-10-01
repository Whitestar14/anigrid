import React, { ReactNode, useCallback } from 'react';
import {
  DndContext,
  MouseSensor,
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
import { useDragState, DragKind } from '@/state/dragState';
import { selectActiveRank } from '@/store/selectors';
import { aspectToCss } from '@/utils/ui';
import { requestDockExpand } from '@/utils/inboxDrag';
import { RemoteImage } from '@/components/ui/RemoteImage';
import { Star } from 'lucide-react';

/* ─── drag type constants ──────────────────────────────────────────── */
export const DRAG_TYPE = {
  CELL: 'cell',
  INBOX_ITEM: 'inbox-item',
  SEARCH_ITEM: 'search-item',
  TIER_ITEM: 'tier-item',
  TIER_ROW: 'tier-row',
} as const;

export const DROP_TYPE = {
  CELL: 'cell',
  TIER_CELL: 'tier-cell',
  TIER_ROW: 'tier-row',
  DOCK: 'inbox-trash',
} as const;

/* ─── Overlay ──────────────────────────────────────────────────────── */
const PREVIEW_MAX = 124;

function previewSize(ratio?: string, width?: number, fallbackRatio = '3:4') {
  const source = ratio && ratio.includes(':') ? ratio : fallbackRatio;
  const [rw, rh] = source.split(':').map(Number);
  const safeRw = rw > 0 ? rw : 3;
  const safeRh = rh > 0 ? rh : 4;

  let w = Math.min(typeof width === 'number' ? width : 120, PREVIEW_MAX);
  let h = (w * safeRh) / safeRw;
  if (h > PREVIEW_MAX) {
    h = PREVIEW_MAX;
    w = (h * safeRw) / safeRh;
  }
  return {
    width: Math.round(w),
    aspectRatio: `${safeRw} / ${safeRh}`,
  };
}

const CustomDragOverlay = () => {
  const { active } = useDndContext();
  const rank = useStore(selectActiveRank);
  if (!active?.data.current || !rank) return null;

  const data = active.data.current;

  /* ── Tier row: a label chip, so you can see which tier you are moving ── */
  if (data.type === DRAG_TYPE.TIER_ROW) {
    return (
      <div
        className="flex items-center justify-center px-5 py-3 material-thick rounded-tile pointer-events-none squircle"
        style={{
          backgroundColor: data.color || 'var(--color-surface-elevated)',
          minWidth: 96,
          opacity: 0.95,
        }}
      >
        <span
          className="text-title-2 font-bold truncate"
          style={{ color: data.textColor || '#fff' }}
        >
          {data.label || ''}
        </span>
      </div>
    );
  }

  if (!data.imageSrc) return null;

  /* ── List row: a wide row preview ─────────────────────────────────── */
  if (data.isRow) {
    return (
      <div
        className="flex items-center gap-4 p-3 material-thick squircle pointer-events-none"
        style={{ width: data.width || '100%', opacity: 0.95, borderRadius: 16 }}
      >
        <div
          className="shrink-0 overflow-hidden squircle"
          style={{
            width: rank.aspectRatio === '1:1' ? 56 : 48,
            aspectRatio: aspectToCss(rank.aspectRatio),
            borderRadius: 8,
          }}
        >
          <RemoteImage src={data.imageSrc} alt="" className="w-full h-full" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-headline font-semibold text-text truncate">
            {data.textLabel || ''}
          </div>
          {data.rating ? (
            <div className="flex items-center gap-1 text-caption-1 font-medium text-accent-yellow">
              <Star size={11} className="fill-accent-yellow" />
              <span>{data.rating}/10</span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  /* ── Tier item: sized to its own tile ─────────────────────────────── */
  if (data.type === DRAG_TYPE.TIER_ITEM) {
    const size = previewSize(data.aspectRatio, data.width, rank.aspectRatio);
    return (
      <div
        className="overflow-hidden pointer-events-none material squircle"
        style={{
          width: size.width,
          aspectRatio: size.aspectRatio,
          borderRadius: 'var(--radius-tile)',
          opacity: 0.95,
          rotate: '-1.5deg',
          boxShadow: 'var(--material-shadow-high)',
        }}
      >
        <RemoteImage src={data.imageSrc} alt="" className="w-full h-full" />
      </div>
    );
  }

  /* ── Poster: grid cells, search and inbox items ───────────────────── */
  const size = previewSize(data.aspectRatio, data.width, rank.aspectRatio);
  return (
    <div
      className="overflow-hidden pointer-events-none material squircle"
      style={{
        width: size.width,
        aspectRatio: size.aspectRatio,
        borderRadius: 'var(--radius-tile)',
        opacity: 0.95,
        rotate: '-1.5deg',
        boxShadow: 'var(--material-shadow-high)',
      }}
    >
      <RemoteImage src={data.imageSrc} alt="" className="w-full h-full" />
    </div>
  );
};

interface ActivePayload {
  type: string;
  index?: number;
  id?: string;
  rowId?: string;
  collectionId?: string;
  imageSrc?: string;
  isRow?: boolean;
}

interface OverPayload {
  type: string;
  index?: number;
  rowId?: string;
}

interface DropContext {
  active: ActivePayload;
  over: OverPayload;
  store: ReturnType<typeof useStore.getState>;
}

interface DropHandler {
  from: string;
  to: string;
  /** Container reorders opt out of the landing pulse on the moved container. */
  silent?: boolean;
  run: (ctx: DropContext) => void;
}

const DROP_HANDLERS: DropHandler[] = [
  {
    from: DRAG_TYPE.TIER_ROW,
    to: DROP_TYPE.TIER_ROW,
    silent: true,
    run: ({ active, over, store }) => {
      const from = active.index;
      const to = over.index;
      if (from === undefined || to === undefined || from === to) return;
      store.handleReorderTierRows(from, to);
    },
  },
  {
    from: DRAG_TYPE.INBOX_ITEM,
    to: DROP_TYPE.CELL,
    run: ({ active, over, store }) => {
      if (over.index === undefined || !active.id || !active.collectionId) return;
      store.handleItemTransfer(
        { type: "inbox", collectionId: active.collectionId, itemId: active.id },
        { type: "cell", index: over.index }
      );
    },
  },
  {
    from: DRAG_TYPE.SEARCH_ITEM,
    to: DROP_TYPE.CELL,
    run: ({ active, over, store }) => {
      if (over.index === undefined || !active.imageSrc) return;
      store.handleItemTransfer(
        { type: "search", imageSrc: active.imageSrc },
        { type: "cell", index: over.index }
      );
    },
  },
  {
    from: DRAG_TYPE.CELL,
    to: DROP_TYPE.CELL,
    run: ({ active, over, store }) => {
      const from = active.index;
      const to = over.index;
      if (from === undefined || to === undefined || from === to) return;
      // A list row reorders; a board tile swaps.
      if (active.isRow) store.handleReorderCells(from, to);
      else store.handleSwapCells(from, to);
    },
  },
  {
    from: DRAG_TYPE.CELL,
    to: DROP_TYPE.DOCK,
    run: ({ active, store }) => {
      if (active.index === undefined) return;
      store.handleItemTransfer(
        { type: "cell", index: active.index },
        { type: "inbox" }
      );
    },
  },
  {
    from: DRAG_TYPE.INBOX_ITEM,
    to: DROP_TYPE.TIER_CELL,
    run: ({ active, over, store }) => {
      if (!over.rowId || !active.id || !active.collectionId) return;
      store.handleItemTransfer(
        { type: "inbox", collectionId: active.collectionId, itemId: active.id },
        { type: "tier", rowId: over.rowId, targetIndex: over.index ?? -1 }
      );
    },
  },
  {
    from: DRAG_TYPE.SEARCH_ITEM,
    to: DROP_TYPE.TIER_CELL,
    run: ({ active, over, store }) => {
      if (!over.rowId || !active.imageSrc) return;
      store.handleItemTransfer(
        { type: "search", imageSrc: active.imageSrc },
        { type: "tier", rowId: over.rowId, targetIndex: over.index ?? -1 }
      );
    },
  },
  {
    /* Tier item moved inside the tier list — including across rows, which used
       to be mistaken for a duplicate add. */
    from: DRAG_TYPE.TIER_ITEM,
    to: DROP_TYPE.TIER_CELL,
    run: ({ active, over, store }) => {
      if (!active.rowId || !active.id || !over.rowId) return;
      store.handleItemTransfer(
        { type: "tier", rowId: active.rowId, itemId: active.id },
        { type: "tier", rowId: over.rowId, targetIndex: over.index ?? -1 }
      );
    },
  },
  {
    from: DRAG_TYPE.TIER_ITEM,
    to: DROP_TYPE.DOCK,
    run: ({ active, store }) => {
      if (!active.rowId || !active.id) return;
      store.handleItemTransfer(
        { type: "tier", rowId: active.rowId, itemId: active.id },
        { type: "inbox" }
      );
    },
  },
  {
    from: DRAG_TYPE.TIER_ITEM,
    to: DROP_TYPE.CELL,
    run: ({ active, over, store }) => {
      if (!active.rowId || !active.id || over.index === undefined) return;
      store.handleItemTransfer(
        { type: "tier", rowId: active.rowId, itemId: active.id },
        { type: "cell", index: over.index }
      );
    },
  },
  {
    from: DRAG_TYPE.CELL,
    to: DROP_TYPE.TIER_CELL,
    run: ({ active, over, store }) => {
      if (active.index === undefined || !over.rowId) return;
      store.handleItemTransfer(
        { type: "cell", index: active.index },
        { type: "tier", rowId: over.rowId, targetIndex: over.index ?? -1 }
      );
    },
  },
];

const findDropHandler = (from?: string, to?: string): DropHandler | null =>
  from && to
    ? (DROP_HANDLERS.find((h) => h.from === from && h.to === to) ?? null)
    : null;

/* ─── Provider ─────────────────────────────────────────────────────── */
export const GlobalDragDropProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 4 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 180, tolerance: 10 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  /* ── onDragStart ────────────────────────────────────────────────── */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeType = event.active.data.current?.type;
    if (activeType === DRAG_TYPE.INBOX_ITEM || activeType === DRAG_TYPE.SEARCH_ITEM) {
      useStore.getState().setIsDraggingFromDock(true);
    }

    // Publish to the ephemeral drag store so grid tiles and tier rows can
    // reveal their drop targets without subscribing to the persisted store.
    if (activeType) {
      useDragState.getState().beginDrag({
        kind: activeType as DragKind,
        index: event.active.data.current?.index,
        id: event.active.id as string,
      });
    }
  }, []);

  /* ── onDragEnd ──────────────────────────────────────────────────── */
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    useStore.getState().setIsDraggingFromDock(false);
    useDragState.getState().endDrag();

    const { active, over } = event;
    if (!over) return;

    const activePayload = active.data.current as ActivePayload | undefined;
    const overPayload = over.data.current as OverPayload | undefined;
    const handler = findDropHandler(activePayload?.type, overPayload?.type);
    if (!activePayload || !overPayload || !handler) return;

    /* Tell the receiving surface a drop just landed on it, so it can play its
       landing animation. Done before the transfer runs so the pulse starts on
       the same frame the data moves. */
    if (!handler.silent) {
      useDragState.getState().setLastDrop(String(over.id));
    }

    /* A drag that began in the dock left it collapsed behind it — that is what
       auto-close is for — so the library is asked back once the drop has settled.
       Only for dock-originated drags: a board-to-board move never touched it. */
    if (
      activePayload.type === DRAG_TYPE.INBOX_ITEM ||
      activePayload.type === DRAG_TYPE.SEARCH_ITEM
    ) {
      requestDockExpand();
    }

    handler.run({
      active: activePayload,
      over: overPayload,
      store: useStore.getState(),
    });
  }, []);

  /* ── onDragCancel ────────────────────────────────────────────────── */
  const handleDragCancel = useCallback(() => {
    useStore.getState().setIsDraggingFromDock(false);
    useDragState.getState().endDrag();
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
      {/* Centred in the dragged node's rect so the card sits under the hand. */}
      <DragOverlay
        dropAnimation={null}
        style={{
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          willChange: 'transform',
        }}
      >
        <CustomDragOverlay />
      </DragOverlay>
    </DndContext>
  );
};
