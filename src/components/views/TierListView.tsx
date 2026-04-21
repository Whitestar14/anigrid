import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rank, TierRow, InteractionState, CellData } from "@/types";
import {
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  Edit2,
  Crop,
  Check,
} from "lucide-react";
import { getProxiedImageUrl } from "@/utils/imageProxy";
import { Select } from "@/components/ui/Select";
import { Settings } from "lucide-react";

interface TierListViewProps {
  rank: Rank;
  onUpdateTierRows: (rows: TierRow[]) => void;
  onInboxDrop: (
    itemId: string,
    collectionId: string,
    rowId: string,
    itemIndex: number,
  ) => void;
  onInboxDropMulti: (
    itemIds: string[],
    collectionId: string,
    rowId: string,
    itemIndex: number,
  ) => void;
  onSearchDrop: (imageSrc: string, rowId: string, itemIndex: number) => void;
  onMoveToInbox: (rowId: string, itemIndex: number) => void;
  // Interaction
  interactionState: InteractionState;
  onInteract: (rowId: string, itemId: string) => void;
  onInternalMove: (
    sourceRowId: string,
    sourceItemId: string,
    targetRowId: string,
    targetIndex: number,
  ) => void;
}

const TierItem: React.FC<{
  item: CellData;
  rowId: string;
  idx: number;
  interactionState: InteractionState;
  onInteract: (rowId: string, itemId: string) => void;
  onMoveToInbox: (rowId: string, itemIndex: number) => void;
  handleItemDrop: (
    e: React.DragEvent,
    targetRowId: string,
    targetIndex: number,
  ) => void;
  onUpdateItem: (
    rowId: string,
    itemId: string,
    updates: Partial<CellData>,
  ) => void;
  onInboxDrop: (
    itemId: string,
    collectionId: string,
    rowId: string,
    itemIndex: number,
  ) => void;
  onInboxDropMulti: (
    itemIds: string[],
    collectionId: string,
    rowId: string,
    itemIndex: number,
  ) => void;
  onInternalMove: (
    sourceRowId: string,
    sourceItemId: string,
    targetRowId: string,
    targetIndex: number,
  ) => void;
  onSearchDrop: (imageSrc: string, rowId: string, itemIndex: number) => void;
  aspectRatio?: "1:1" | "3:4" | "4:3" | "16:9" | "9:16";
}> = ({
  item,
  rowId,
  idx,
  interactionState,
  onInteract,
  onMoveToInbox,
  handleItemDrop,
  onUpdateItem,
  onInboxDrop,
  onInboxDropMulti,
  onInternalMove,
  onSearchDrop,
  aspectRatio,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);

  const aspectMap: Record<string, string> = {
    "1:1": "w-24 h-24",
    "3:4": "w-24 h-32",
    "4:3": "w-32 h-24",
    "16:9": "w-[136px] h-20",
    "9:16": "w-20 h-32",
  };

  const [zoom, setZoom] = useState(item.zoom || 1);
  const [posX, setPosX] = useState(
    item.objectPosition ? parseInt(item.objectPosition.split(" ")[0]) : 50,
  );
  const [posY, setPosY] = useState(
    item.objectPosition ? parseInt(item.objectPosition.split(" ")[1]) : 50,
  );

  const objectPosStyle: React.CSSProperties = {
    objectPosition: isAdjusting
      ? `${posX}% ${posY}%`
      : item.objectPosition || "center",
    transform: `scale(${isAdjusting ? zoom : item.zoom || 1})`,
    transformOrigin: "center",
  };

  const saveAdjustments = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateItem(rowId, item.id, { zoom, objectPosition: `${posX}% ${posY}%` });
    setIsAdjusting(false);
  };

  return (
    <div
      className={`relative group/item transition-all duration-200 ${isDragging ? "opacity-40 scale-95 grayscale" : ""} ${isDragOver ? "ring-4 ring-primary bg-primary/20 z-20 scale-105 shadow-2xl" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect =
          e.dataTransfer.effectAllowed === "move" ? "move" : "copy";
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        handleItemDrop(e, rowId, idx);
      }}
      onClick={(e) => {
        if (
          (e.target as HTMLElement).closest("button") ||
          (e.target as HTMLElement).closest(".adjust-controls") ||
          (e.target as HTMLElement).closest(".popover-menu")
        )
          return;
        e.stopPropagation();
        if (interactionState?.type === "inbox") {
          onInboxDrop(
            interactionState.itemId,
            interactionState.collectionId,
            rowId,
            idx,
          );
        } else if (interactionState?.type === "inbox-multi") {
          onInboxDropMulti(
            interactionState.itemIds,
            interactionState.collectionId,
            rowId,
            idx,
          );
        } else if (interactionState?.type === "tier-item") {
          onInternalMove(
            interactionState.rowId,
            interactionState.itemId,
            rowId,
            idx,
          );
        } else if (interactionState?.type === "search") {
          onSearchDrop(interactionState.imageSrc, rowId, idx);
        } else {
          onInteract(rowId, item.id);
        }
      }}
      draggable={!isAdjusting}
      onDragStart={(e) => {
        e.dataTransfer.setData(
          "application/json",
          JSON.stringify({ type: "tier-item", rowId: rowId, itemId: item.id }),
        );
        e.dataTransfer.effectAllowed = "move";
        setTimeout(() => setIsDragging(true), 0);
      }}
      onDragEnd={() => setIsDragging(false)}
    >
      <div
        className={`
                ${aspectMap[aspectRatio || "3:4"]} relative cursor-grab active:cursor-grabbing overflow-hidden select-none bg-black/20
                ${interactionState?.type === "tier-item" && interactionState.itemId === item.id ? "opacity-50 ring-2 ring-primary z-10" : ""}
            `}
      >
        <img
          src={getProxiedImageUrl(item.imageSrc!)}
          className="w-full h-full object-cover pointer-events-none transition-all duration-300"
          style={objectPosStyle}
          referrerPolicy="no-referrer"
        />

        {/* Hover Controls (Desktop) */}
        {!isAdjusting && (
          <div className="absolute top-0 right-0 hidden md:flex gap-1 p-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity export-hidden">
            <button
              className="bg-black/60 text-white p-1 hover:bg-white/20 rounded-sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsAdjusting(true);
              }}
              title="Crop & Adjust"
            >
              <Crop size={12} />
            </button>
            <button
              className="bg-black/60 text-white p-1 hover:bg-red-500 rounded-sm"
              onClick={(e) => {
                e.stopPropagation();
                onMoveToInbox(rowId, idx);
              }}
              title="Remove"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Adjust Controls */}
        {isAdjusting && (
          <div className="export-hidden adjust-controls absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-1 gap-2 z-30">
            <div className="w-full flex flex-col gap-1 bg-black/40 p-1 rounded-md border border-white/10">
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1 accent-primary"
                title="Zoom"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={posX}
                onChange={(e) => setPosX(parseInt(e.target.value))}
                className="w-full h-1 accent-primary"
                title="Pan X"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={posY}
                onChange={(e) => setPosY(parseInt(e.target.value))}
                className="w-full h-1 accent-primary"
                title="Pan Y"
              />
            </div>
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAdjusting(false);
                }}
                className="p-1 bg-white/10 hover:bg-white/20 text-white rounded-sm transition-colors"
              >
                <X size={12} />
              </button>
              <button
                onClick={saveAdjustments}
                className="p-1 bg-primary hover:bg-primary/80 text-white rounded-sm transition-colors"
              >
                <Check size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Popover Menu (Mobile Only) */}
      <AnimatePresence>
        {interactionState?.type === "tier-item" &&
          interactionState.itemId === item.id &&
          !isAdjusting && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="popover-menu md:hidden absolute top-full mt-2 w-32 left-1/2 -translate-x-1/2 bg-[#2c2c2e]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl z-[100] flex flex-col p-1"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAdjusting(true);
                }}
                className="flex items-center justify-between p-3 hover:bg-white/10 rounded-xl text-[13px] font-medium text-white transition-colors"
              >
                Adjust <Crop size={14} className="text-white/50" />
              </button>
              <div className="h-px bg-white/10 mx-2 my-0.5" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToInbox(rowId, idx);
                }}
                className="flex items-center justify-between p-3 hover:bg-red-500/20 text-red-500 rounded-xl text-[13px] font-medium transition-colors"
              >
                Remove <X size={14} className="text-red-500/50" />
              </button>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};

export const TierListView: React.FC<TierListViewProps> = ({
  rank,
  onUpdateTierRows,
  onInboxDrop,
  onInboxDropMulti,
  onSearchDrop,
  onMoveToInbox,
  interactionState,
  onInteract,
  onInternalMove,
}) => {
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [activeDropRowId, setActiveDropRowId] = useState<string | null>(null);

  const handleUpdateRow = (rowId: string, updates: Partial<TierRow>) => {
    const newRows = rank.tierRows.map((r) =>
      r.id === rowId ? { ...r, ...updates } : r,
    );
    onUpdateTierRows(newRows);
  };

  const handleMoveRow = (index: number, direction: "up" | "down") => {
    const newRows = [...rank.tierRows];
    if (direction === "up" && index > 0) {
      [newRows[index], newRows[index - 1]] = [
        newRows[index - 1],
        newRows[index],
      ];
    } else if (direction === "down" && index < newRows.length - 1) {
      [newRows[index], newRows[index + 1]] = [
        newRows[index + 1],
        newRows[index],
      ];
    }
    onUpdateTierRows(newRows);
  };

  const handleDeleteRow = (index: number) => {
    const newRows = rank.tierRows.filter((_, i) => i !== index);
    onUpdateTierRows(newRows);
  };

  const handleClearRow = (rowId: string) => {
    const newRows = rank.tierRows.map((r) =>
      r.id === rowId ? { ...r, items: [] } : r,
    );
    onUpdateTierRows(newRows);
  };

  const handleAddRow = () => {
    const newRow: TierRow = {
      id: `tier-${Date.now()}`,
      label: "NEW",
      color: "#334155",
      items: [],
    };
    onUpdateTierRows([...rank.tierRows, newRow]);
  };

  const handleRowClick = (rowId: string) => {
    if (!interactionState) return;

    // If dropping from inbox to empty space in row -> Append to end (index -1)
    if (interactionState.type === "inbox") {
      onInboxDrop(
        interactionState.itemId,
        interactionState.collectionId,
        rowId,
        -1,
      );
    } else if (interactionState.type === "inbox-multi") {
      onInboxDropMulti(
        interactionState.itemIds,
        interactionState.collectionId,
        rowId,
        -1,
      );
    } else if (interactionState.type === "tier-item") {
      onInternalMove(
        interactionState.rowId,
        interactionState.itemId,
        rowId,
        -1,
      );
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent, rowId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect =
      e.dataTransfer.effectAllowed === "move" ? "move" : "copy";
    if (activeDropRowId !== rowId) setActiveDropRowId(rowId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setActiveDropRowId(null);
  };

  const handleDropOnRow = (e: React.DragEvent, rowId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDropRowId(null);

    const dataStr = e.dataTransfer.getData("application/json");
    if (!dataStr) return;

    try {
      const data = JSON.parse(dataStr);
      const targetRow = rank.tierRows.find((r) => r.id === rowId);
      const targetIndex = targetRow ? targetRow.items.length : 0;

      if (data.type === "inbox") {
        onInboxDrop(data.id, data.originCollectionId, rowId, targetIndex);
      } else if (data.type === "inbox-multi") {
        onInboxDropMulti(data.ids, data.originCollectionId, rowId, targetIndex);
      } else if (data.type === "search") {
        onSearchDrop(data.imageSrc, rowId, targetIndex);
      } else if (data.type === "tier-item") {
        onInternalMove(data.rowId, data.itemId, rowId, targetIndex);
      }
    } catch {}
  };

  const handleItemDrop = (
    e: React.DragEvent,
    targetRowId: string,
    targetIndex: number,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDropRowId(null);

    const dataStr = e.dataTransfer.getData("application/json");
    if (!dataStr) return;
    try {
      const data = JSON.parse(dataStr);
      if (data.type === "inbox") {
        onInboxDrop(data.id, data.originCollectionId, targetRowId, targetIndex);
      } else if (data.type === "inbox-multi") {
        onInboxDropMulti(
          data.ids,
          data.originCollectionId,
          targetRowId,
          targetIndex,
        );
      } else if (data.type === "search") {
        onSearchDrop(data.imageSrc, targetRowId, targetIndex);
      } else if (data.type === "tier-item") {
        onInternalMove(data.rowId, data.itemId, targetRowId, targetIndex);
      }
    } catch {}
  };

  const handleUpdateItem = (
    rowId: string,
    itemId: string,
    updates: Partial<CellData>,
  ) => {
    const newRows = rank.tierRows.map((r) => {
      if (r.id === rowId) {
        return {
          ...r,
          items: r.items.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item,
          ),
        };
      }
      return r;
    });
    onUpdateTierRows(newRows);
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto pb-20 border-b border-border">
      {rank.tierRows.map((row, rowIndex) => (
        <div
          key={row.id}
          className="flex min-h-[6rem] border-t border-border bg-surface"
        >
          {/* 1. Header (Left) */}
          <div
            className="w-24 sm:w-32 flex items-center justify-center p-2 shrink-0 relative border-r border-border cursor-text group/label"
            style={{ backgroundColor: row.color }}
            onClick={() => setEditingLabelId(row.id)}
          >
            {editingLabelId === row.id ? (
              <textarea
                autoFocus
                value={row.label}
                onChange={(e) =>
                  handleUpdateRow(row.id, { label: e.target.value })
                }
                onBlur={() => setEditingLabelId(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setEditingLabelId(null);
                  }
                }}
                className="w-full h-full bg-transparent text-center text-black/80 font-black font-sans text-xl sm:text-2xl resize-none outline-none flex items-center justify-center overflow-hidden placeholder:text-black/30"
                style={{ lineHeight: "1.2" }}
                placeholder="Label"
              />
            ) : (
              <span className="text-center text-black/80 font-black font-sans text-xl sm:text-2xl break-words leading-tight w-full select-none">
                {row.label}
              </span>
            )}

            {editingLabelId !== row.id && (
              <div className="absolute top-1 right-1 opacity-0 group-hover/label:opacity-50">
                <Edit2 size={10} className="text-black" />
              </div>
            )}
          </div>

          {/* 2. Content (Middle) - Compact Layout */}
          <div
            className={`
                flex-1 flex flex-wrap content-start items-start min-h-[6rem] transition-all duration-200
                ${activeDropRowId === row.id ? "bg-primary/20 ring-inset ring-2 ring-primary shadow-inner" : "bg-surface"}
            `}
            onDragOver={(e) => handleDragOver(e, row.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDropOnRow(e, row.id)}
            onClick={() => handleRowClick(row.id)}
          >
            {row.items.map((item, idx) => (
              <TierItem
                key={item.id}
                item={item}
                rowId={row.id}
                idx={idx}
                interactionState={interactionState}
                onInteract={onInteract}
                onMoveToInbox={onMoveToInbox}
                handleItemDrop={handleItemDrop}
                onUpdateItem={handleUpdateItem}
                onInboxDrop={onInboxDrop}
                onInboxDropMulti={onInboxDropMulti}
                onInternalMove={onInternalMove}
                onSearchDrop={onSearchDrop}
              />
            ))}

            {/* Invisible Filler */}
            <div className="flex-1 min-h-[6rem]" />
          </div>

          {/* 3. Controls (Right) */}
          <div className="w-10 sm:w-16 bg-surface shrink-0 flex flex-col items-center justify-between py-1 border-l border-border export-hidden px-1">
              <Select
                value=""
                onChange={(val) => {
                  if (val === 'clear') handleClearRow(row.id);
                  if (val === 'delete') handleDeleteRow(rowIndex);
                }}
                options={[
                  { label: "Clear Images", value: "clear" },
                  { label: "Delete Row", value: "delete" }
                ]}
                customTrigger={
                  <button className="p-1 text-muted hover:text-text transition-colors mt-1" title="Settings">
                    <Settings size={18} />
                  </button>
                }
                alignOffset="right"
                dropdownClassName="w-48"
                className="w-auto flex justify-center"
              />

             <div className="flex flex-col gap-1">
              <button
                onClick={() => handleMoveRow(rowIndex, "up")}
                disabled={rowIndex === 0}
                className="p-1 text-muted hover:text-text disabled:opacity-30 disabled:hover:text-muted transition-colors"
              >
                <ChevronUp size={18} />
              </button>
              <button
                onClick={() => handleMoveRow(rowIndex, "down")}
                disabled={rowIndex === rank.tierRows.length - 1}
                className="p-1 text-muted hover:text-text disabled:opacity-30 disabled:hover:text-muted transition-colors"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Add Row Button */}
      <div className="bg-surface p-4 sm:p-6 flex flex-col justify-center export-hidden border-t border-border">
        <button
          onClick={handleAddRow}
          className="flex items-center justify-center gap-3 w-full sm:w-auto self-center px-8 py-4 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white/70 hover:text-white border border-dashed border-white/20 hover:border-white/40 rounded-[20px] transition-all font-semibold text-[15px] shadow-sm hover:shadow-lg"
        >
          <div className="p-1 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
            <Plus size={18} strokeWidth={2.5} />
          </div>
          <span className="tracking-wide">Add New Tier</span>
        </button>
      </div>
    </div>
  );
};
