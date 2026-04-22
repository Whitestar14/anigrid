import React from "react";
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
const DOCK_RADIUS = "24px";

export const BottomDockLayout: React.FC<{ ctrl: BottomDockCtrl }> = ({
  ctrl,
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
    handleDragStart: handleDragStartBase,
    handleItemClick,
    handleBulkDelete,
    handleSearchDragStart: handleSearchDragStartBase,
    handleSmartAdd,
    handleDeleteItem,
    handleDrop,
    handleDragOver,
    toggleExpand,
    handleCollectionPick,
    requestDeleteCollection,
    onFileInputChange,
    expandDockAfterDrag,
  } = ctrl;

  // Wrap drag handlers to also honour autoclose
  const handleDragStart = React.useCallback(
    (e: React.DragEvent, id: string) => {
      handleDragStartBase(e, id);
      // After writing drag data, close if pref says so (desktop) or always on mobile
      const isMobile = window.innerWidth < 768;
      if (isMobile || autoCloseDockDesktop) {
        setIsExpanded(false);
      }
    },
    [handleDragStartBase, autoCloseDockDesktop, setIsExpanded],
  );

  const handleSearchDragStart = React.useCallback(
    (e: React.DragEvent, src: string) => {
      handleSearchDragStartBase(e, src);
      const isMobile = window.innerWidth < 768;
      if (isMobile || autoCloseDockDesktop) {
        setIsExpanded(false);
      }
    },
    [handleSearchDragStartBase, autoCloseDockDesktop, setIsExpanded],
  );

  const commitRename = (colId: string) => {
    if (tempName.trim()) renameCollection(colId, tempName);
    setEditingNameId(null);
  };

  const startRename = (id: string, name: string) => {
    setEditingNameId(id);
    setTempName(name);
  };

  // Single source-of-truth for glass styles — same token as sidebar
  const glassPanel = reduceGlass
    ? "bg-surface border border-border shadow-2xl"
    : "bg-surface/90 backdrop-blur-3xl border border-white/10 shadow-2xl";

  // Collapsed: use the app surface color so it feels unified, not foreign
  const collapsedPanel = reduceGlass
    ? "bg-surface border border-border shadow-2xl"
    : "bg-surface/80 backdrop-blur-2xl border border-white/8 shadow-[0_4px_24px_rgba(0,0,0,0.4)]";

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-4 flex justify-center`}
      style={{
        width: isExpanded ? "min(100%, 768px)" : "min(100%, 340px)",
        transition: "width 300ms cubic-bezier(0.32,0.72,0,1)",
      }}
    >
      <div
        className={`
          w-full overflow-hidden flex flex-col
          transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${isExpanded ? glassPanel : collapsedPanel}
          ${isDragOver ? "ring-2 ring-blue-500 ring-inset" : ""}
        `}
        style={{
          height: isExpanded ? "28rem" : "3.5rem",
          // Keep border-radius constant — avoids the weird morph
          borderRadius: DOCK_RADIUS,
        }}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        {!isExpanded ? (
          /* ── Collapsed pill ─────────────────────────────── */
          <div className="h-14 flex items-center shrink-0 pr-1 pl-2">
            <button
              type="button"
              aria-label="Open Library"
              className="flex-1 flex items-center justify-center gap-2.5 text-[14px] font-medium text-white/90 hover:bg-white/5 transition-all duration-150 h-12 rounded-[20px]"
              onClick={() => {
                setDockSurface("library");
                setActiveTab("stash");
                setIsExpanded(true);
              }}
            >
              <Library size={18} strokeWidth={2} />
              <span>Library</span>
            </button>
            <div className="w-px bg-white/10 h-8 mx-1 shrink-0" />
            <button
              type="button"
              aria-label="Open Settings"
              className="w-12 h-12 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5 transition-all duration-150 rounded-[20px] shrink-0"
              onClick={() => {
                setDockSurface("settings");
                setIsExpanded(true);
              }}
            >
              <Settings2 size={20} strokeWidth={2} />
            </button>
          </div>
        ) : dockSurface === "settings" ? (
          /* ── Settings surface ───────────────────────────── */
          <>
            <DockSurfaceHeader
              title="Settings"
              onCollapse={() => setIsExpanded(false)}
            />
            <SettingsDockPanel />
          </>
        ) : (
          /* ── Library surface ────────────────────────────── */
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
                    onSearchDragStart={handleSearchDragStart}
                    onSearchDragEndExpand={expandDockAfterDrag}
                    onSmartAdd={handleSmartAdd}
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
                    onDragStart={handleDragStart}
                    onDragEndExpand={expandDockAfterDrag}
                    onItemClick={handleItemClick}
                    onDeleteItem={handleDeleteItem}
                  />
                </div>
              </div>
            </div>
          </>
        )}
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
    className="h-12 flex items-center justify-between px-5 shrink-0 border-b border-white/10 cursor-pointer select-none"
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
