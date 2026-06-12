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

const DOCK_RADIUS = "22px";

export const BottomDockLayout: React.FC<{
  ctrl: BottomDockCtrl;
  requestConfirm?: (
    title: string,
    message: string,
    onConfirm: () => void
  ) => void;
  onOpenAbout?: () => void;
}> = ({ ctrl, requestConfirm, onOpenAbout }) => {
  const reduceGlass = useStore(
    (s) => s.preferences.reduceGlassEffects ?? false
  );
  const autoCloseDockDesktop = useStore(
    (s) => s.preferences.autoCloseDockOnDragDesktop ?? false
  );

  const [autoFocusSearch, setAutoFocusSearch] = React.useState(false);

  const { isOver: isDndOver, setNodeRef: setDroppableRef } = useDroppable({
    id: "inbox-trash",
    data: { type: "inbox-trash" },
  });

  const isDraggingFromDockRef = React.useRef(ctrl.isDraggingFromDock);

  let reopenTimeout: NodeJS.Timeout;
  React.useEffect(() => {
    if (!ctrl.isDraggingFromDock && isDraggingFromDockRef.current) {
      // Re-expand the dock after a short delay to allow UI to settle when drag ends
      clearTimeout(reopenTimeout);
      reopenTimeout = setTimeout(() => ctrl.setIsExpanded(true), 300);
    }
    isDraggingFromDockRef.current = ctrl.isDraggingFromDock;

    return () => {
      clearTimeout(reopenTimeout);
    };
  }, [ctrl.isDraggingFromDock, ctrl.setIsExpanded]);

  React.useEffect(() => {
    const handleOpenSearch = () => {
      ctrl.setDockSurface("library");
      ctrl.setActiveTab("search");
      ctrl.setIsExpanded(true);
      setAutoFocusSearch(true);
      // Brief timeout to let focus happen, then reset so it can be re-triggered
      setTimeout(() => setAutoFocusSearch(false), 500);
    };
    window.addEventListener("open-inbox-search", handleOpenSearch);
    return () =>
      window.removeEventListener("open-inbox-search", handleOpenSearch);
  }, [ctrl.setDockSurface, ctrl.setActiveTab, ctrl.setIsExpanded]);

  const dockRef = React.useRef<HTMLDivElement>(null);
  const setDockRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      dockRef.current = node;
      setDroppableRef(node);
    },
    [setDroppableRef]
  );

  useDndMonitor({
    onDragMove(event) {
      if (isDraggingFromDockRef.current && ctrl.isExpanded) {
        if (!dockRef.current) return;
        const rect = dockRef.current.getBoundingClientRect();
        const y = event.active.rect.current.translated?.top;
        const x = event.active.rect.current.translated?.left;

        if (y !== undefined && x !== undefined) {
          if (
            y < rect.top ||
            y >= rect.bottom ||
            x < rect.left ||
            x >= rect.right
          ) {
            const isMobile = window.innerWidth < 768;
            if (isMobile || autoCloseDockDesktop) {
              ctrl.setIsExpanded(false);
            }
          }
        }
      }
    },
  });

  const commitRename = (colId: string) => {
    if (ctrl.tempName.trim()) ctrl.renameCollection(colId, ctrl.tempName);
    ctrl.setEditingNameId(null);
  };

  const startRename = (id: string, name: string) => {
    ctrl.setEditingNameId(id);
    ctrl.setTempName(name);
  };

  // Single source-of-truth for glass styles — same token as sidebar
  const glassPanel = "glass";
  const collapsedPanel = "glass-panel";

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 md:px-4 flex justify-center w-full`}
      style={{
        maxWidth: ctrl.isExpanded ? "768px" : "100%",
        width: ctrl.isExpanded
          ? "var(--expanded-dock-width, calc(100% - 16px))"
          : "auto",
        transition:
          "width 240ms cubic-bezier(0.32,0.72,0,1), max-width 240ms cubic-bezier(0.32,0.72,0,1)",
      }}
    >
      <div
        ref={setDockRefs}
        className={`
          relative overflow-hidden flex flex-col
          transition-all duration-240 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${ctrl.isExpanded ? glassPanel : collapsedPanel}
          ${ctrl.isDragOver || isDndOver ? "focus-ring" : ""}
        `}
        style={{
          width: ctrl.isExpanded
            ? "100%"
            : "clamp(220px, calc(100vw - 120px), 310px)",
          height: ctrl.isExpanded ? "24rem" : "3rem",
          // Keep border-radius constant — avoids the weird morph
          borderRadius: DOCK_RADIUS,
          boxShadow: ctrl.isExpanded ? "none" : undefined,
        }}
        onDrop={ctrl.handleDrop}
      >
        <div
          className={`absolute left-0 right-0 top-0 flex items-stretch px-2 py-1.5 h-[3rem] gap-1 transition-opacity duration-200 ${
            !ctrl.isExpanded
              ? "opacity-100 pointer-events-auto delay-75"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <button
            type="button"
            aria-label="Open Library"
            className="flex-1 min-w-0 flex items-center justify-center gap-2 text-[14px] font-medium text-text hover:bg-hover transition-all duration-150 rounded-[14px]"
            onClick={() => {
              ctrl.setDockSurface("library");
              ctrl.setActiveTab("stash");
              ctrl.setIsExpanded(true);
            }}
          >
            <Library size={16} strokeWidth={2} className="shrink-0" />
            <span className="truncate">Library</span>
          </button>
          <div className="w-px bg-border self-center h-5 shrink-0" />
          <button
            type="button"
            aria-label="Open Settings"
            className="w-10 flex items-center justify-center text-muted hover:text-text hover:bg-hover transition-all duration-150 rounded-[14px] shrink-0"
            onClick={() => {
              ctrl.setDockSurface("settings");
              ctrl.setIsExpanded(true);
            }}
          >
            <Settings2 size={18} strokeWidth={2} />
          </button>
        </div>

        {/* ── Expanded surfaces ───────────────────────────── */}
        <div
          className={`flex flex-col w-full h-[28rem] transition-opacity duration-200 ${
            ctrl.isExpanded
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          {ctrl.dockSurface === "settings" ? (
            <>
              <DockSurfaceHeader
                title="Settings"
                onCollapse={() => ctrl.setIsExpanded(false)}
              />
              <SettingsDockPanel
                requestConfirm={requestConfirm}
                onOpenAbout={onOpenAbout}
              />
            </>
          ) : (
            <>
              <InboxDockHeader
                activeTab={ctrl.activeTab}
                onToggleExpand={ctrl.toggleExpand}
                onSelectTab={(tab) => {
                  ctrl.setActiveTab(tab);
                  ctrl.setIsExpanded(true);
                }}
              />

              <div className="flex-1 overflow-hidden relative flex flex-col min-h-0 bg-surface-secondary">
                <div className="flex-1 min-h-0 flex flex-col relative">
                  {ctrl.activeTab === "picker" && (
                    <InboxCollectionPickerPanel
                      collections={ctrl.collections}
                      lastTargetCollectionId={ctrl.lastTargetCollectionId}
                      editingNameId={ctrl.editingNameId}
                      tempName={ctrl.tempName}
                      onBack={() => ctrl.setActiveTab("search")}
                      onPickCollection={ctrl.handleCollectionPick}
                      onAddCollection={ctrl.addCollection}
                      onStartRename={startRename}
                      onTempNameChange={ctrl.setTempName}
                      onCommitRename={commitRename}
                      onCancelRename={() => ctrl.setEditingNameId(null)}
                    />
                  )}

                  <div
                    className={`flex-1 min-h-0 ${
                      ctrl.activeTab === "search" ? "flex flex-col" : "hidden"
                    }`}
                  >
                    <InboxSearchView
                      searchQuery={ctrl.searchQuery}
                      searchMode={ctrl.searchMode}
                      searchResults={ctrl.searchResults}
                      usedImageSrcs={ctrl.usedImageSrcs}
                      onQueryChange={ctrl.setSearchQuery}
                      onModeChange={ctrl.setSearchMode}
                      onResultsChange={ctrl.setSearchResults}
                      onSmartAdd={ctrl.handleSmartAdd}
                      autoFocus={autoFocusSearch}
                    />
                  </div>

                  <div
                    className={`flex-1 min-h-0 ${
                      ctrl.activeTab === "stash" ? "flex flex-col" : "hidden"
                    }`}
                  >
                    <InboxStashView
                      fileInputRef={ctrl.fileInputRef}
                      collections={ctrl.collections}
                      activeCollectionId={ctrl.activeCollectionId}
                      currentItems={ctrl.currentItems}
                      isAllView={ctrl.isAllView}
                      usedOnBoard={ctrl.usedOnBoard}
                      selectedItemIds={ctrl.selectedItemIds}
                      interactionState={ctrl.interactionState}
                      editingNameId={ctrl.editingNameId}
                      tempName={ctrl.tempName}
                      onSwitchCollection={ctrl.switchCollection}
                      onAddCollection={ctrl.addCollection}
                      onStartRename={startRename}
                      onTempNameChange={ctrl.setTempName}
                      onCommitRename={commitRename}
                      onRequestDeleteCollection={ctrl.requestDeleteCollection}
                      onBulkDelete={ctrl.handleBulkDelete}
                      onClearSelection={() => {
                        ctrl.setSelectedItemIds(new Set());
                        useStore.getState().setInteractionState(null);
                      }}
                      onMoveItemsToCollection={(targetId) => {
                        ctrl.moveItemsToCollection(
                          Array.from(ctrl.selectedItemIds),
                          targetId
                        );
                        ctrl.setSelectedItemIds(new Set());
                        useStore.getState().setInteractionState(null);
                      }}
                      onUploadClick={() => ctrl.fileInputRef.current?.click()}
                      onFileChange={ctrl.onFileInputChange}
                      onItemClick={ctrl.handleItemClick}
                      onDeleteItem={ctrl.handleDeleteItem}
                      onRecall={ctrl.handleRecall}
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
    className="h-12 flex items-center justify-between pl-5 pr-1 sm:pr-2 shrink-0 border-b border-border cursor-pointer select-none"
    onClick={onCollapse}
  >
    <span className="text-[15px] font-semibold text-text">{title}</span>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onCollapse();
      }}
      className="p-1.5 rounded-full hover:bg-hover text-muted hover:text-text transition-colors"
      title="Collapse"
    >
      <ChevronDown size={19} />
    </button>
  </div>
);
