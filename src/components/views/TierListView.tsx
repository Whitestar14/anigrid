import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { TierRow, CellData } from "@/types";
import { PopoverMenu } from "../ui/PopoverMenu";
import {
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  Edit2,
  Crop,
  Check,
  Settings
} from "lucide-react";
import { getProxiedImageUrl } from "@/utils/imageProxy";
import { TIER_ASPECT_MAP } from "@/utils/ui";
import { Select } from "@/components/ui/Select";
import { useStore } from "@/store/useStore";
import { selectTierItem, selectActiveRank } from "@/store/selectors";

const TierItem = React.memo(function TierItem({
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
  const interactionState = useStore(s => s.interactionState);
  const setInteractionState = useStore(s => s.setInteractionState);
  const onMoveToInbox = useStore(s => s.handleTierMoveToInbox);
  const onInboxDrop = useStore(s => s.handleInboxDropToTier);
  const onInboxDropMulti = useStore(s => s.handleInboxDropToTierMulti);
  const onInternalMove = useStore(s => s.handleInternalTierMove);
  const onSearchDrop = useStore(s => s.handleSearchDropToTier);
  const onUpdateItem = useStore(s => s.handleUpdateCell); // This might need a specialized tier update if types differ

  const tierRef = useRef<HTMLDivElement>(null);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isAdjustDragging, setIsAdjustDragging] = useState(false);
  const [localClickPoint, setLocalClickPoint] = useState<{ x: number; y: number } | null>(null);

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
    tierRef.current = node;
    setDroppableRef(node);
    if (!isAdjusting && item?.imageSrc) {
      setDraggableRef(node);
    } else {
      setDraggableRef(null);
    }
  };

  const [zoom, setZoom] = useState(item?.zoom || 1);
  const [posX, setPosX] = useState(
    item?.objectPosition ? parseInt(item.objectPosition.split(" ")[0]) : 50,
  );
  const [posY, setPosY] = useState(
    item?.objectPosition ? parseInt(item.objectPosition.split(" ")[1]) : 50,
  );

  useEffect(() => {
    const handleMouseUp = () => setIsAdjustDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (!isAdjustDragging || !tierRef.current) return;
      const rect = tierRef.current.getBoundingClientRect();
      const percentX = (e.movementX / rect.width) * 100 / zoom;
      const percentY = (e.movementY / rect.height) * 100 / zoom;
      setPosX(prev => Math.min(Math.max(0, prev - percentX), 100));
      setPosY(prev => Math.min(Math.max(0, prev - percentY), 100));
    };
    if (isAdjustDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isAdjustDragging, zoom]);

  const handleWheel = (e: React.WheelEvent) => {
    if (!isAdjusting) return;
    e.stopPropagation();
    const newZoom = Math.min(Math.max(1, zoom - (e.deltaY * 0.005)), 4);
    setZoom(newZoom);
  };

  const saveAdjustments = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdjusting(false);
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
        if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest(".adjust-controls")) return;
        e.stopPropagation();

        const point = { x: e.clientX, y: e.clientY };
        setLocalClickPoint(point);
        const current = useStore.getState().interactionState;

        // Inbox -> Tier
        if (current?.type === "inbox") {
          onInboxDrop(current.itemId, current.collectionId, rowId, idx);
          setInteractionState(null);
          setLocalClickPoint(null);
          return;
        }

        // Multi-Inbox -> Tier
        if (current?.type === "inbox-multi") {
          onInboxDropMulti(current.itemIds, current.collectionId, rowId, idx);
          setInteractionState(null);
          setLocalClickPoint(null);
          return;
        }

        // Internal Tier Move
        if (current?.type === "tier-item") {
          if (current.itemId !== item.id) {
            onInternalMove(current.rowId, current.itemId, rowId, idx);
            setInteractionState(null);
            setLocalClickPoint(null);
          } else {
            setInteractionState(null);
            setLocalClickPoint(null);
          }
          return;
        }

        // Search -> Tier
        if (current?.type === "search") {
          onSearchDrop(current.imageSrc, rowId, idx);
          setInteractionState(null);
          setLocalClickPoint(null);
          return;
        }

        // Grid Cell -> Tier
        if (current?.type === "cell") {
          const cells = useStore.getState().ranks[useStore.getState().activeRankId]?.cells;
          const cell = cells?.[current.index];
          if (cell?.imageSrc) {
            onSearchDrop(cell.imageSrc, rowId, idx);
            useStore.getState().handleCellClear(current.index);
            setInteractionState(null);
            setLocalClickPoint(null);
          }
          return;
        }

        setInteractionState({ type: "tier-item", rowId, itemId: item.id });
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
          <div className="absolute inset-0 bg-surface/50 flex flex-col items-center justify-between p-1 z-30" onMouseDown={() => setIsAdjustDragging(true)} onWheel={handleWheel}>
            <div className="bg-surface-elevated text-text text-[8px] uppercase font-bold px-2 py-0.5 rounded-full">Adjust Mode</div>
            <div className="flex gap-1 mb-1">
              <button onClick={(e) => { e.stopPropagation(); setIsAdjusting(false); }} className="p-1.5 bg-surface-elevated rounded-full text-text"><X size={12} /></button>
              <button onClick={saveAdjustments} className="p-1.5 bg-primary rounded-full text-white"><Check size={12} /></button>
            </div>
          </div>
        )}
      </div>
      {interactionState?.type === "tier-item" && interactionState.itemId === item.id && !isAdjusting && (
        <PopoverMenu
          isOpen={true}
          onClose={() => { setInteractionState(null); setLocalClickPoint(null); }}
          triggerPoint={localClickPoint}
          actions={[
            { label: 'Adjust', icon: Crop, onClick: () => setIsAdjusting(true) },
            { label: 'Remove', icon: X, onClick: () => onMoveToInbox(rowId, idx), variant: 'danger' }
          ]}
        />
      )}
    </motion.div>
  );
});

const TierRowWrapper: React.FC<{ rowId: string; children: React.ReactNode; onClick: () => void; justify?: "left" | "center" | "right" }> = ({ rowId, children, onClick, justify }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `tier-row-body-${rowId}`,
    data: { type: 'tier-cell', rowId, index: -1 }
  });

  const justifyClass = justify === 'left' ? 'justify-start text-left' : 
                       justify === 'right' ? 'justify-end text-right' : 
                       'justify-center text-center';

  return (
    <div ref={setNodeRef} className={`relative flex-1 flex flex-wrap content-start ${justifyClass} items-start min-h-[6rem] transition-all bg-surface ${isOver ? "bg-primary/5 focus-ring scale-[1.01] z-10 shadow-inner" : ""}`} onClick={onClick}>
      {children}
    </div>
  );
};

export const TierListView: React.FC = () => {
  const rank = useStore(selectActiveRank);
  const interactionState = useStore(s => s.interactionState);
  const setInteractionState = useStore(s => s.setInteractionState);
  const handleUpdateTierRows = useStore(s => s.handleUpdateTierRows);
  const handleInboxDropToTier = useStore(s => s.handleInboxDropToTier);
  const handleInboxDropToTierMulti = useStore(s => s.handleInboxDropToTierMulti);
  const handleInternalTierMove = useStore(s => s.handleInternalTierMove);

  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);

  if (!rank) return null;

  const handleUpdateRow = (rowId: string, updates: Partial<TierRow>) => {
    const newRows = rank.tierRows.map((r) => r.id === rowId ? { ...r, ...updates } : r);
    handleUpdateTierRows(newRows);
  };

  const handleMoveRow = (index: number, direction: "up" | "down") => {
    const newRows = [...rank.tierRows];
    if (direction === "up" && index > 0) [newRows[index], newRows[index - 1]] = [newRows[index - 1], newRows[index]];
    else if (direction === "down" && index < newRows.length - 1) [newRows[index], newRows[index + 1]] = [newRows[index + 1], newRows[index]];
    handleUpdateTierRows(newRows);
  };

  const handleDeleteRow = (index: number) => {
    const newRows = rank.tierRows.filter((_, i) => i !== index);
    handleUpdateTierRows(newRows);
  };

  const handleAddRow = () => {
    const newRow: TierRow = { id: `tier-${Date.now()}`, label: "NEW", color: "#334155", items: [] };
    handleUpdateTierRows([...rank.tierRows, newRow]);
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto pb-20 border-b border-border">
      {rank.tierRows.map((row, rowIndex) => (
        <div key={row.id} className="flex min-h-[6rem] border-t border-border bg-surface">
          <div className="w-24 sm:w-32 flex items-center justify-center p-2 shrink-0 relative border-r border-border cursor-text group/label" style={{ backgroundColor: row.color }} onClick={() => setEditingLabelId(row.id)}>
            {editingLabelId === row.id ? (
              <textarea autoFocus value={row.label} onChange={(e) => handleUpdateRow(row.id, { label: e.target.value })} onBlur={() => setEditingLabelId(null)} className="w-full h-full bg-transparent text-center text-text font-black text-xl resize-none outline-none overflow-hidden" />
            ) : (
              <span className="text-center text-text font-black text-xl break-words leading-tight w-full select-none">{row.label}</span>
            )}
          </div>
          <TierRowWrapper 
            rowId={row.id} 
            justify={rank.gridJustify}
            onClick={() => {
              const current = useStore.getState().interactionState;
              if (!current) return;

              if (current.type === "inbox") {
                handleInboxDropToTier(current.itemId, current.collectionId, row.id, -1);
              } else if (current.type === "inbox-multi") {
                handleInboxDropToTierMulti(current.itemIds, current.collectionId, row.id, -1);
              } else if (current.type === "tier-item") {
                handleInternalTierMove(current.rowId, current.itemId, row.id, -1);
              } else if (current.type === "search") {
                handleSearchDropToTier(current.imageSrc, row.id, -1);
              } else if (current.type === "cell") {
                const cells = useStore.getState().ranks[useStore.getState().activeRankId]?.cells;
                const cell = cells?.[current.index];
                if (cell?.imageSrc) {
                  handleSearchDropToTier(cell.imageSrc, row.id, -1);
                  useStore.getState().handleCellClear(current.index);
                }
              }
              setInteractionState(null);
            }}>
            <AnimatePresence>
              {row.items.map((item, idx) => (
                <TierItem key={item.id} rowId={row.id} idx={idx} item={item} aspectRatio={rank.aspectRatio || "3:4"} />
              ))}
            </AnimatePresence>
            {row.items.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-muted text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-border px-4 py-2 rounded-xl">
                  Drop here
                </span>
              </div>
            )}
          </TierRowWrapper>
          <div className="w-10 sm:w-16 bg-surface shrink-0 flex flex-col items-center justify-between py-1 border-l border-border">
            <Select value="" onChange={(val) => { if (val === 'clear') handleUpdateRow(row.id, { items: [] }); if (val === 'delete') handleDeleteRow(rowIndex); }} options={[{ label: "Clear Images", value: "clear" }, { label: "Delete Row", value: "delete" }]} customTrigger={
              <button className="w-8 h-8 flex items-center justify-center text-muted hover:text-text hover:bg-hover rounded-full transition-colors mt-1">
                <Settings size={18} />
              </button>
            } alignOffset="right" dropdownClassName="w-48" />
            <div className="flex flex-col gap-1">
              <button onClick={() => handleMoveRow(rowIndex, "up")} disabled={rowIndex === 0} className="p-1 text-muted hover:text-text disabled:opacity-30"><ChevronUp size={18} /></button>
              <button onClick={() => handleMoveRow(rowIndex, "down")} disabled={rowIndex === rank.tierRows.length - 1} className="p-1 text-muted hover:text-text disabled:opacity-30"><ChevronDown size={18} /></button>
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={handleAddRow}
        className="w-full flex min-h-[4rem] items-center justify-center gap-3 bg-surface hover:bg-hover text-muted hover:text-text border-t border-border transition-all group/add-row"
      >
        <Plus size={24} className="group-hover/add-row:scale-110 transition-transform" />
        <span className="text-sm font-black uppercase tracking-[0.2em]">Add New Tier</span>
      </button>
    </div>
  );
};
