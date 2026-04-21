import React, { useRef, useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  InboxCollection,
  InboxItem,
  JikanResult,
  InteractionState,
} from "@/types";
import {
  Plus,
  X,
  Upload,
  FolderPlus,
  Edit,
  Trash,
  Check,
  Box,
  Layers,
  ChevronDown,
  ChevronUp,
  Package,
  Globe,
  ArrowLeft,
  Image as ImageIcon,
} from "lucide-react";
import { SearchPanel } from "@/components/SearchPanel";
import { CuteSlime } from "@/components/EmptyStateVector";
import { getProxiedImageUrl } from "@/utils/imageProxy";

interface InboxProps {
  collections: InboxCollection[];
  activeCollectionId: string;
  usedImageSrcs: Set<string>; // Items in the Inbox (for Search checkmarks)
  usedOnBoard: Set<string>; // Items on the Active Grid (for Stash gray-out)
  onSwitchCollection: (id: string) => void;
  onAddCollection: () => void;
  onDeleteCollection: (id: string) => void;
  onRenameCollection: (id: string, name: string) => void;
  onUpload: (files: FileList) => void;
  onRemoveItem: (itemId: string) => void;
  onDropFromGrid: (cellIndex: number) => void;
  onDropFromTier?: (rowId: string, itemId: string) => void;
  // New props for smart add
  lastTargetCollectionId?: string;
  onAddToCollection: (imageSrc: string, collectionId: string) => void;
  onUpdateLastTarget: (collectionId: string) => void;
  onRestoreItem?: (item: InboxItem, collectionId: string) => void;

  // Interaction
  interactionState: InteractionState;
  onInteract: (itemId: string, collectionId: string) => void;
  addToast?: (
    type: "success" | "info" | "error",
    message: string,
    actionLabel?: string,
    action?: () => void,
  ) => void;
}

const InboxItemView: React.FC<{
  item: InboxItem;
  isUsed: boolean;
  isSelected: boolean;
  isAllView: boolean;
  activeCollectionId: string;
  handleDragStart: (e: React.DragEvent, id: string) => void;
  handleDragEnd: () => void;
  handleItemClick: (e: React.MouseEvent, itemId: string) => void;
  handleDeleteItem: (item: InboxItem) => void;
}> = ({
  item,
  isUsed,
  isSelected,
  isAllView,
  _activeCollectionId,
  handleDragStart,
  handleDragEnd,
  handleItemClick,
  handleDeleteItem,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        handleDragStart(e, item.id);
        setTimeout(() => setIsDragging(true), 0);
      }}
      onDragEnd={() => {
        setIsDragging(false);
        handleDragEnd();
      }}
      onClick={(e) => handleItemClick(e, item.id)}
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
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteItem(item);
          }}
          className="absolute top-2 right-2 p-1.5 bg-black/40 text-white rounded-full hover:bg-red-500 transition-all z-10 backdrop-blur-md group-hover:opacity-100 shadow-sm"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export const Inbox: React.FC<InboxProps> = ({
  collections,
  activeCollectionId,
  usedImageSrcs,
  usedOnBoard,
  onSwitchCollection,
  onAddCollection,
  onDeleteCollection,
  onRenameCollection,
  onUpload,
  onRemoveItem,
  onDropFromGrid,
  onDropFromTier,
  lastTargetCollectionId,
  onAddToCollection,
  onUpdateLastTarget,
  onRestoreItem,
  interactionState,
  onInteract,
  addToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // View Modes: stash | search | picker
  const [activeTab, setActiveTab] = useState<"stash" | "search" | "picker">(
    "stash",
  );
  const [isExpanded, setIsExpanded] = useState(false);

  // Search State (Lifted)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"anime" | "characters">(
    "characters",
  );
  const [searchResults, setSearchResults] = useState<JikanResult[]>([]);

  // Local UI State
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set(),
  );

  // Picker State: Holds the image source we want to add
  const [pendingPickerImage, setPendingPickerImage] = useState<string | null>(
    null,
  );

  // Derived "All" collection
  const allItems = useMemo(() => {
    return collections.flatMap((c) => c.items);
  }, [collections]);

  const activeCollection = collections.find((c) => c.id === activeCollectionId);
  const currentItems =
    activeCollectionId === "all-images"
      ? allItems
      : activeCollection?.items || [];
  const isAllView = activeCollectionId === "all-images";

  // Clear selection when changing collections
  useEffect(() => {
    setSelectedItemIds(new Set());
  }, [activeCollectionId]);

  useEffect(() => {
    const handleOpenSearch = () => {
      setIsExpanded(true);
      setActiveTab("search");
    };
    window.addEventListener("open-inbox-search", handleOpenSearch);
    return () =>
      window.removeEventListener("open-inbox-search", handleOpenSearch);
  }, [setIsExpanded, setActiveTab]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    const idsToDrag = selectedItemIds.has(id)
      ? Array.from(selectedItemIds)
      : [id];
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: "inbox-multi",
        ids: idsToDrag,
        originCollectionId: isAllView ? "all" : activeCollectionId,
      }),
    );
    e.dataTransfer.effectAllowed = "copy";

    // Auto-close on mobile only, not desktop
    if (window.innerWidth < 768) {
      setIsExpanded(false);
    }
  };

  const handleItemClick = (e: React.MouseEvent, itemId: string) => {
    if (e.shiftKey) {
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        if (next.has(itemId)) next.delete(itemId);
        else next.add(itemId);
        return next;
      });
    } else {
      setSelectedItemIds(new Set([itemId]));
      onInteract(itemId, isAllView ? "all-images" : activeCollectionId);
    }
  };

  const handleBulkDelete = () => {
    if (selectedItemIds.size === 0) return;
    selectedItemIds.forEach((id) => onRemoveItem(id));
    setSelectedItemIds(new Set());
    if (addToast) {
      addToast("info", `Removed ${selectedItemIds.size} items`);
    }
  };

  const handleSearchDragStart = (e: React.DragEvent, imageSrc: string) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: "search",
        imageSrc,
      }),
    );
    e.dataTransfer.effectAllowed = "copy";

    // Auto-close on mobile only, not desktop
    if (window.innerWidth < 768) {
      setIsExpanded(false);
    }
  };

  const handleSmartAdd = (imageSrc: string) => {
    // 1. If we have a valid last target, use it
    if (
      lastTargetCollectionId &&
      collections.some((c) => c.id === lastTargetCollectionId)
    ) {
      const targetName =
        collections.find((c) => c.id === lastTargetCollectionId)?.name ||
        "Collection";
      onAddToCollection(imageSrc, lastTargetCollectionId);

      if (addToast) {
        addToast("success", `Added to ${targetName}`, "Change", () => {
          setPendingPickerImage(imageSrc);
          setActiveTab("picker");
        });
      }
    } else {
      // 2. No target, switch to picker tab
      setPendingPickerImage(imageSrc);
      setActiveTab("picker");
    }
  };

  const handleDeleteItem = (item: InboxItem) => {
    onRemoveItem(item.id);

    // Determine which collection it belonged to (crucial for Undo)
    let originCollectionId = activeCollectionId;
    if (isAllView) {
      // Find logic: brute force search
      const foundCol = collections.find((c) =>
        c.items.some((i) => i.id === item.id),
      );
      if (foundCol) originCollectionId = foundCol.id;
    }

    if (addToast) {
      addToast("info", "Image removed from stash", "Undo", () => {
        if (onRestoreItem) onRestoreItem(item, originCollectionId);
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (activeTab === "stash" && !isAllView) {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onUpload(e.dataTransfer.files);
        if (!isExpanded) setIsExpanded(true);
        return;
      }
    }

    const dragData = e.dataTransfer.getData("application/json");
    if (dragData) {
      try {
        const source = JSON.parse(dragData);
        if (source.type === "cell") {
          onDropFromGrid(source.index);
          setTimeout(() => setIsExpanded(true), 400);
        } else if (source.type === "tier-item" && onDropFromTier) {
          onDropFromTier(source.rowId, source.itemId);
          setTimeout(() => setIsExpanded(true), 400);
        }
      } catch {}
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    if (!isExpanded) setIsExpanded(true);
  };

  const toggleExpand = () => setIsExpanded(!isExpanded);

  // Auto-switch back to search after picking
  const handleCollectionPick = (colId: string) => {
    if (!pendingPickerImage) return;
    onAddToCollection(pendingPickerImage, colId);
    onUpdateLastTarget(colId);
    setPendingPickerImage(null);
    setActiveTab("search"); // Go back to search

    const colName = collections.find((c) => c.id === colId)?.name;
    if (addToast) {
      addToast("success", `Added to ${colName}`);
    }
  };

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-4 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] flex justify-center ${isExpanded ? "w-full max-w-3xl" : "w-[180px] sm:w-[240px]"}`}
    >
      <div
        className={`
          w-full bg-[#1c1c1e]/90 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden
          transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col
          ${isExpanded ? "h-[28rem] rounded-[32px]" : "h-14 rounded-[28px]"}
          ${isDragOver ? "ring-2 ring-blue-500 ring-inset" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Dock Header */}
        <div
          className="h-14 flex items-center justify-between px-5 sm:px-6 select-none cursor-pointer hover:bg-white/5 transition-colors shrink-0 border-b border-white/10"
          onClick={toggleExpand}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[13px] font-medium tracking-wide text-white/50 uppercase">
              <Box size={16} />{" "}
              <span className={!isExpanded ? "inline" : "hidden sm:inline"}>
                Library
              </span>
            </div>

            {/* Dock Tabs - Only visible when expanded */}
            {isExpanded && (
              <div
                className="flex items-center bg-[#767680]/24 rounded-xl p-1 animate-in fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setActiveTab("stash");
                    setIsExpanded(true);
                  }}
                  className={`
                          flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all
                          ${activeTab === "stash" ? "bg-[#636366] text-white shadow-sm" : "text-white/70 hover:text-white"}
                      `}
                >
                  <ImageIcon size={14} /> Stash
                </button>
                <button
                  onClick={() => {
                    setActiveTab("search");
                    setIsExpanded(true);
                  }}
                  className={`
                          flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all
                          ${activeTab === "search" || activeTab === "picker" ? "bg-[#636366] text-white shadow-sm" : "text-white/70 hover:text-white"}
                      `}
                >
                  <Globe size={14} /> Search
                </button>
              </div>
            )}
          </div>

          <button className="text-white/70 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>

        {/* Dock Content Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col min-h-0 bg-black/20">
          {/* Content Wrapper */}
          <div className="flex-1 min-h-0 flex flex-col relative">
            {/* VIEW: PICKER (Replaces Overlay) */}
            {activeTab === "picker" && (
              <div className="absolute inset-0 bg-[#1c1c1e] flex flex-col p-6 animate-in fade-in slide-in-from-right-4 z-20">
                <div className="flex items-center gap-3 mb-6 shrink-0">
                  <button
                    onClick={() => setActiveTab("search")}
                    className="p-2 hover:bg-white/10 rounded-full text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h3 className="text-[15px] font-semibold text-white">
                    Select Collection
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar">
                  {collections.map((col) => {
                    const isEditing = editingNameId === col.id;
                    return (
                      <div
                        key={col.id}
                        onClick={() =>
                          !isEditing && handleCollectionPick(col.id)
                        }
                        className={`
                                      group relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-3 text-center h-32
                                      ${
                                        col.id === lastTargetCollectionId
                                          ? "bg-blue-500/10 border-blue-500/50 text-blue-500"
                                          : "bg-[#2c2c2e] border-transparent hover:border-white/10 hover:bg-[#3a3a3c] text-white/70 hover:text-white cursor-pointer"
                                      }
                                  `}
                      >
                        <Package size={28} strokeWidth={1.5} />
                        {isEditing ? (
                          <input
                            autoFocus
                            type="text"
                            value={tempName}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => setTempName(e.target.value)}
                            onBlur={() => {
                              if (tempName.trim())
                                onRenameCollection(col.id, tempName);
                              setEditingNameId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") e.currentTarget.blur();
                            }}
                            className="w-full bg-black/40 border border-white/20 rounded px-2 py-0.5 text-[13px] text-white outline-none focus:border-blue-500 text-center"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <>
                            <span className="font-medium text-[13px] line-clamp-2">
                              {col.name}
                            </span>
                            {col.id === lastTargetCollectionId && (
                              <span className="text-[11px] font-medium text-blue-500/70 absolute bottom-2">
                                Recent
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingNameId(col.id);
                                setTempName(col.name);
                              }}
                              className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all"
                            >
                              <Edit2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                  <button
                    onClick={() => {
                      onAddCollection();
                    }}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed border-white/20 hover:border-blue-500 hover:text-blue-500 transition-all gap-3 text-center h-32 text-white/50 hover:bg-blue-500/5 cursor-pointer"
                  >
                    <FolderPlus size={28} strokeWidth={1.5} />
                    <span className="font-medium text-[13px]">Create New</span>
                  </button>
                </div>
              </div>
            )}

            {/* VIEW: SEARCH */}
            <div
              className={`flex-1 min-h-0 ${activeTab === "search" ? "block" : "hidden"} p-4`}
            >
              <SearchPanel
                query={searchQuery}
                onQueryChange={setSearchQuery}
                mode={searchMode}
                onModeChange={setSearchMode}
                results={searchResults}
                onResultsChange={setSearchResults}
                onDragStart={handleSearchDragStart}
                onDragEnd={() => setTimeout(() => setIsExpanded(true), 400)}
                onAdd={handleSmartAdd}
                usedImageSrcs={usedImageSrcs}
              />
            </div>

            {/* VIEW: STASH */}
            <div
              className={`flex-1 min-h-0 flex flex-col ${activeTab === "stash" ? "block" : "hidden"}`}
            >
              {/* Stash Toolbar */}
              <div className="flex items-center gap-2 px-6 py-3 border-b border-white/10 shrink-0 overflow-x-auto hide-scrollbar bg-[#1c1c1e]/50">
                {selectedItemIds.size > 0 ? (
                  <div className="flex items-center gap-3 w-full animate-in fade-in">
                    <span className="text-[13px] font-medium text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-lg">
                      {selectedItemIds.size} Selected
                    </span>
                    <button
                      onClick={handleBulkDelete}
                      className="flex items-center gap-1.5 text-[13px] font-medium text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Trash size={14} />
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedItemIds(new Set())}
                      className="flex items-center gap-1.5 text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors ml-auto"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Virtual "All" Tab */}
                    <div
                      onClick={() => onSwitchCollection("all-images")}
                      className={`
                                      flex items-center gap-2 px-4 py-1.5 cursor-pointer text-[13px] font-medium rounded-lg transition-all shrink-0
                                      ${activeCollectionId === "all-images" ? "bg-[#636366] text-white shadow-sm" : "text-white/70 hover:text-white hover:bg-white/10"}
                                    `}
                    >
                      <Layers size={14} />
                      All
                    </div>

                    <div className="w-px h-4 bg-white/10 mx-1 shrink-0"></div>

                    {collections.map((col) => {
                      const isActive = col.id === activeCollectionId;
                      const isEditing = editingNameId === col.id;

                      return (
                        <div
                          key={col.id}
                          onClick={() =>
                            !isEditing && onSwitchCollection(col.id)
                          }
                          className={`
                                        group relative flex items-center gap-2 px-4 py-1.5 cursor-pointer text-[13px] font-medium rounded-lg transition-all min-w-[100px] justify-between shrink-0
                                        ${
                                          isActive
                                            ? "bg-[#636366] text-white shadow-sm"
                                            : "text-white/70 hover:text-white hover:bg-white/10"
                                        }
                                      `}
                        >
                          {isEditing ? (
                            <input
                              autoFocus
                              type="text"
                              value={tempName}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => setTempName(e.target.value)}
                              onBlur={() => {
                                if (tempName.trim())
                                  onRenameCollection(col.id, tempName);
                                setEditingNameId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") e.currentTarget.blur();
                              }}
                              className="bg-transparent border-none outline-none text-white w-full font-medium"
                            />
                          ) : (
                            <div className="flex items-center gap-2 max-w-[120px]">
                              <span className="truncate">{col.name}</span>
                              {isActive && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTempName(col.name);
                                    setEditingNameId(col.id);
                                  }}
                                  className="text-white/50 hover:text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Rename"
                                >
                                  <Edit size={12} />
                                </button>
                              )}
                            </div>
                          )}

                          {!isEditing && isActive && collections.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCollection(col.id);
                              }}
                              className="p-0.5 hover:text-red-400 text-white/50 transition-colors ml-auto opacity-0 group-hover:opacity-100"
                              title="Delete Collection"
                            >
                              <Trash size={12} />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    <motion.button
                      whileTap={{ scale: 0.9, rotate: 90 }}
                      onClick={onAddCollection}
                      className="px-3 py-1.5 text-white/70 hover:text-blue-400 transition-colors hover:bg-white/10 rounded-lg"
                      title="Create New Collection"
                    >
                      <Plus size={16} />
                    </motion.button>
                  </>
                )}
              </div>

              {/* Stash Grid */}
              <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar">
                <div className="flex gap-4 h-full items-center">
                  {currentItems.length === 0 ? (
                    <div
                      onClick={() =>
                        !isAllView && fileInputRef.current?.click()
                      }
                      className={`flex-1 flex flex-col items-center justify-center text-white/40 text-[13px] font-medium select-none h-full border border-dashed border-white/10 rounded-2xl bg-[#2c2c2e]/30 p-4 transition-colors ${!isAllView ? "cursor-pointer hover:border-white/20 hover:bg-[#2c2c2e]/50 hover:text-white/60" : ""}`}
                    >
                      <CuteSlime className="w-16 h-16 text-white/20 mb-4" />
                      {isAllView ? (
                        "Your library is empty."
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="mb-1 leading-tight">
                            Drag items here or move them from the board
                          </span>
                          <span className="text-[11px] uppercase tracking-widest text-blue-400/80 mt-2 font-bold group-hover:text-blue-400">
                            Tap to Upload
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {!isAllView && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="shrink-0 w-28 h-40 border border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center text-white/50 hover:text-blue-400 hover:border-blue-400 transition-all group bg-[#2c2c2e]/50 hover:bg-[#3a3a3c]/50"
                        >
                          <Upload
                            size={24}
                            className="group-hover:scale-110 transition-transform mb-3"
                            strokeWidth={1.5}
                          />
                          <span className="text-[11px] font-medium uppercase tracking-widest">
                            Upload
                          </span>
                        </button>
                      )}
                      {currentItems.map((item) => {
                        const isUsed = usedOnBoard.has(item.imageSrc);
                        const isSelected =
                          selectedItemIds.has(item.id) ||
                          (interactionState?.type === "inbox" &&
                            interactionState.itemId === item.id);

                        return (
                          <InboxItemView
                            key={item.id}
                            item={item}
                            isUsed={isUsed}
                            isSelected={isSelected}
                            isAllView={isAllView}
                            activeCollectionId={activeCollectionId}
                            handleDragStart={handleDragStart}
                            handleDragEnd={() =>
                              setTimeout(() => setIsExpanded(true), 400)
                            }
                            handleItemClick={handleItemClick}
                            handleDeleteItem={handleDeleteItem}
                          />
                        );
                      })}
                    </>
                  )}
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                multiple
                className="hidden"
                accept="image/*"
                onChange={(e) => e.target.files && onUpload(e.target.files)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
