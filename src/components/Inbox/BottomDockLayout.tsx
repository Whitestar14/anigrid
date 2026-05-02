import React from "react";
import { useDroppable, useDndMonitor } from "@dnd-kit/core";
import { Library, Settings2, ChevronDown } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useInboxController } from "@/hooks/useInboxController";
import { InboxDockHeader } from "./InboxDockHeader";
import { InboxCollectionPickerPanel } from "./InboxCollectionPickerPanel";
import { InboxSearchView } from "./InboxSearchView";
import { InboxStashView } from "./InboxStashView";
import { SettingsDockPanel } from "./SettingsDockPanel";

export type BottomDockCtrl = ReturnType<typeof useInboxController>;

// Always use the same border radius — we animate height, NOT border-radius.
// Using a constant large radius means it always looks pill-like while collapsed
// and naturally square-cornered while tall.
const DOCK_RADIUS = "22px";

export const BottomDockLayout: React.FC<{ ctrl: BottomDockCtrl; requestConfirm?: (title: string, message: string, onConfirm: () => void) => void }> = ({
  ctrl,
  requestConfirm,
}) => {
  const reduceGlass = useStore((s) => s.preferences.reduceGlassEffects ?? false);
  const autoCloseDockDesktop = useStore(
    (s) => s.preferences.autoCloseDockOnDragDesktop ?? false,
  );
  const {
    fileInputRef,
    dockSurface,
    setDockSurface,
    collections,
    activeCollectionId,
    lastTargetCollectionId,
    interactionState,
    switchCollection,
    addCollection,
    renameCollection,
    usedImageSrcs,
    usedOnBoard,
    currentItems,
    isAllView,
    activeTab,
    setActiveTab,
    isExpanded,
    setIsExpanded,
    searchQuery,
    setSearchQuery,
    searchMode,
    setSearchMode,
    searchResults,
    setSearchResults,
    editingNameId,
    setEditingNameId,
    tempName,
    setTempName,
    selectedItemIds,
    setSelectedItemIds,
    isDragOver,
    setIsDragOver,
    handleItemClick,
    handleBulkDelete,
    handleSmartAdd,
    handleDeleteItem,
    handleDrop,
    handleDragOver,
    toggleExpand,
    handleCollectionPick,
    requestDeleteCollection,
    onFileInputChange,
    handleRecall,
    setIsDraggingFromDock,
    isDraggingFromDock,
  } = ctrl;

  const [autoFocusSearch, setAutoFocusSearch] = React.useState(false);

  const { isOver: isDndOver, setNodeRef: setDroppableRef } = useDroppable({
    id: 'inbox-trash',
    data: { type: 'inbox-trash' }
  });

  const isDraggingFromDockRef = React.useRef(isDraggingFromDock);

  React.useEffect(() => {
    let reopenTimeout: NodeJS.Timeout;
    if (!isDraggingFromDock && isDraggingFromDockRef.current) {
      // Re-expand the dock after a short delay to allow UI to settle when drag ends
      clearTimeout(reopenTimeout);
      reopenTimeout = setTimeout(() => setIsExpanded(true), 300);
    }
    isDraggingFromDockRef.current = isDraggingFromDock;

    return () => {
      clearTimeout(reopenTimeout);
    };
  }, [isDraggingFromDock, setIsExpanded]);

  React.useEffect(() => {
    const handleOpenSearch = () => {
      setDockSurface("library");
      setActiveTab("search");
      setIsExpanded(true);
      setAutoFocusSearch(true);
      // Brief timeout to let focus happen, then reset so it can be re-triggered
      setTimeout(() => setAutoFocusSearch(false), 500);
    };
    window.addEventListener("open-inbox-search", handleOpenSearch);
    return () => window.removeEventListener("open-inbox-search", handleOpenSearch);
  }, [setDockSurface, setActiveTab, setIsExpanded]);

  const dockRef = React.useRef<HTMLDivElement>(null);
  const setDockRefs = React.useCallback((node: HTMLDivElement | null) => {
    dockRef.current = node;
    setDroppableRef(node);
  }, [setDroppableRef]);

  useDndMonitor({
    onDragMove(event) {
      if (isDraggingFromDockRef.current && isExpanded) {
        if (!dockRef.current) return;
        const rect = dockRef.current.getBoundingClientRect();
        const y = event.active.rect.current.translated?.top;
        const x = event.active.rect.current.translated?.left;

        if (y !== undefined && x !== undefined) {
          if (y < rect.top || y >= rect.bottom || x < rect.left || x >= rect.right) {
            const isMobile = window.innerWidth < 768;
            if (isMobile || autoCloseDockDesktop) {
              setIsExpanded(false);
            }
          }
        }
      }
    }
  });


  const commitRename = (colId: string) => {
    if (tempName.trim()) renameCollection(colId, tempName);
    setEditingNameId(null);
  };

  const startRename = (id: string, name: string) => {
    setEditingNameId(id);
    setTempName(name);
  };

  // Single source-of-truth for glass styles — same token as sidebar
  const glassPanel = "glass";
  const collapsedPanel = "glass-panel";

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-4 flex justify-center w-full`}
      style={{
        maxWidth: isExpanded ? "768px" : "100%",
        width: isExpanded ? "calc(100% - 32px)" : "auto",
        transition: "width 240ms cubic-bezier(0.32,0.72,0,1), max-width 240ms cubic-bezier(0.32,0.72,0,1)",
      }}
    >
      <div
        ref={setDockRefs}
        className={`
          relative overflow-hidden flex flex-col
          transition-all duration-240 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${isExpanded ? glassPanel : collapsedPanel}
          ${isDragOver || isDndOver ? "ring-2 ring-blue-500 ring-inset" : ""}
        `}
        style={{
          width: isExpanded ? "100%" : "clamp(220px, calc(100vw - 120px), 310px)",
          height: isExpanded ? "28rem" : "3rem",
          // Keep border-radius constant — avoids the weird morph
          borderRadius: DOCK_RADIUS,
          boxShadow: isExpanded ? "none" : "0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)"
        }}
        onDrop={handleDrop}
      >
        <div
          className={`absolute left-0 right-0 top-0 flex items-center pr-1 pl-2 h-[3rem] transition-opacity duration-200 ${!isExpanded ? "opacity-100 pointer-events-auto delay-75" : "opacity-0 pointer-events-none"}`}
        >
          <button
            type="button"
            aria-label="Open Library"
            className="flex-1 min-w-0 flex items-center justify-center gap-2.5 text-[14px] font-medium text-white/90 hover:bg-white/5 transition-all duration-150 h-9 rounded-[14px]"
            onClick={() => {
              setDockSurface("library");
              setActiveTab("stash");
              setIsExpanded(true);
            }}
          >
            <Library size={16} strokeWidth={2} className="shrink-0" />
            <span className="truncate">Library</span>
          </button>
          <div className="w-px bg-white/10 h-6 mx-1 shrink-0" />
          <button
            type="button"
            aria-label="Open Settings"
            className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5 transition-all duration-150 rounded-[14px] shrink-0"
            onClick={() => {
              setDockSurface("settings");
              setIsExpanded(true);
            }}
          >
            <Settings2 size={18} strokeWidth={2} />
          </button>
        </div>

        {/* ── Expanded surfaces ───────────────────────────── */}
        <div
          className={`flex flex-col w-full h-[28rem] transition-opacity duration-200 ${isExpanded ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        >
          {dockSurface === "settings" ? (
            <>
              <DockSurfaceHeader
                title="Settings"
                onCollapse={() => setIsExpanded(false)}
              />
              <SettingsDockPanel requestConfirm={requestConfirm} />
            </>
          ) : (
            <>
              <InboxDockHeader
                activeTab={activeTab}
                onToggleExpand={toggleExpand}
                onSelectTab={(tab) => {
                  setActiveTab(tab);
                  setIsExpanded(true);
                }}
              />

              <div className="flex-1 overflow-hidden relative flex flex-col min-h-0 bg-black/20">
                <div className="flex-1 min-h-0 flex flex-col relative">
                  {activeTab === "picker" && (
                    <InboxCollectionPickerPanel
                      collections={collections}
                      lastTargetCollectionId={lastTargetCollectionId}
                      editingNameId={editingNameId}
                      tempName={tempName}
                      onBack={() => setActiveTab("search")}
                      onPickCollection={handleCollectionPick}
                      onAddCollection={addCollection}
                      onStartRename={startRename}
                      onTempNameChange={setTempName}
                      onCommitRename={commitRename}
                      onCancelRename={() => setEditingNameId(null)}
                    />
                  )}

                  <div
                    className={`flex-1 min-h-0 ${activeTab === "search" ? "flex flex-col" : "hidden"}`}
                  >
                    <InboxSearchView
                      searchQuery={searchQuery}
                      searchMode={searchMode}
                      searchResults={searchResults}
                      usedImageSrcs={usedImageSrcs}
                      onQueryChange={setSearchQuery}
                      onModeChange={setSearchMode}
                      onResultsChange={setSearchResults}
                      onSmartAdd={handleSmartAdd}
                      autoFocus={autoFocusSearch}
                    />
                  </div>

                  <div
                    className={`flex-1 min-h-0 ${activeTab === "stash" ? "flex flex-col" : "hidden"}`}
                  >
                    <InboxStashView
                      fileInputRef={fileInputRef}
                      collections={collections}
                      activeCollectionId={activeCollectionId}
                      currentItems={currentItems}
                      isAllView={isAllView}
                      usedOnBoard={usedOnBoard}
                      selectedItemIds={selectedItemIds}
                      interactionState={interactionState}
                      editingNameId={editingNameId}
                      tempName={tempName}
                      onSwitchCollection={switchCollection}
                      onAddCollection={addCollection}
                      onStartRename={startRename}
                      onTempNameChange={setTempName}
                      onCommitRename={commitRename}
                      onRequestDeleteCollection={requestDeleteCollection}
                      onBulkDelete={handleBulkDelete}
                      onClearSelection={() => setSelectedItemIds(new Set())}
                      onUploadClick={() => fileInputRef.current?.click()}
                      onFileChange={onFileInputChange}
                      onItemClick={handleItemClick}
                      onDeleteItem={handleDeleteItem}
                      onRecall={handleRecall}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/** Reusable header for any dock surface (Settings, etc.) */
const DockSurfaceHeader: React.FC<{
  title: string;
  onCollapse: () => void;
}> = ({ title, onCollapse }) => (
  <div
    className="h-12 flex items-center justify-between pl-5 pr-1 sm:pr-2 shrink-0 border-b border-white/10 cursor-pointer select-none"
    onClick={onCollapse}
  >
    <span className="text-[15px] font-semibold text-white">{title}</span>
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onCollapse(); }}
      className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
      title="Collapse"
    >
      <ChevronDown size={19} />
    </button>
  </div>
);
