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

const DOCK_RADIUS = "var(--radius-bar)";

/**
 * How long the pointer must dwell over a collapsed dock before it springs
 * open, mirroring Apple's spring-loading behaviour. A short dwell keeps a
 * drag that merely passes over the dock from popping it open.
 */
const SPRING_LOAD_DELAY = 400;

export const BottomDockLayout: React.FC<{
  ctrl: BottomDockCtrl;
  requestConfirm?: (
    title: string,
    message: string,
    onConfirm: () => void
  ) => void;
  onOpenAbout?: () => void;
}> = ({ ctrl, requestConfirm, onOpenAbout }) => {
  const autoCloseDockDesktop = useStore(
    (s) => s.preferences.autoCloseDockOnDragDesktop ?? false
  );

  const [autoFocusSearch, setAutoFocusSearch] = React.useState(false);
  /** True when a drag is hovering the dock — the pre-drop highlight. */
  const [isDockHot, setIsDockHot] = React.useState(false);
  /**
   * True while an external drag (a file from the desktop, an image from another
   * window) is inside the window. Only while this is set does the dock mount its
   * tall spring zone, so the zone can never swallow ordinary clicks.
   */
  const [isExternalDrag, setIsExternalDrag] = React.useState(false);

  const { isOver: isDndOver, setNodeRef: setDroppableRef } = useDroppable({
    id: "inbox-trash",
    data: { type: "inbox-trash" },
  });

  const isDraggingFromDockRef = React.useRef(ctrl.isDraggingFromDock);
  const timers = React.useRef<{ expand?: number }>({});

  React.useEffect(() => {
    isDraggingFromDockRef.current = ctrl.isDraggingFromDock;
  }, [ctrl.isDraggingFromDock]);

  React.useEffect(
    () => () => {
      window.clearTimeout(timers.current.expand);
    },
    []
  );

  const swipeStartY = React.useRef<number | null>(null);
  const handleBarTouchStart = (e: React.TouchEvent) => {
    swipeStartY.current = e.touches[0]?.clientY ?? null;
  };
  const handleBarTouchMove = (e: React.TouchEvent) => {
    const start = swipeStartY.current;
    if (start === null) return;
    const dy = (e.touches[0]?.clientY ?? start) - start;
    if (dy < -14) {
      swipeStartY.current = null;
      ctrl.setIsExpanded(true);
    }
  };

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

  React.useEffect(() => {
    const isExternal = (e: DragEvent) =>
      Array.from(e.dataTransfer?.types ?? []).some(
        (t) => t === "Files" || t === "text/uri-list" || t === "text/html"
      );

    let idle: number | undefined;
    const stop = () => {
      window.clearTimeout(idle);
      setIsExternalDrag(false);
    };

    const handleOver = (e: DragEvent) => {
      if (!isExternal(e)) return;
      setIsExternalDrag(true);
      window.clearTimeout(idle);
      idle = window.setTimeout(() => setIsExternalDrag(false), 400);
    };

    const swallow = (e: DragEvent) => {
      if (isExternal(e)) e.preventDefault();
      stop();
    };

    window.addEventListener("dragover", handleOver);
    window.addEventListener("dragover", swallow);
    window.addEventListener("drop", swallow);
    window.addEventListener("dragend", stop);
    return () => {
      window.clearTimeout(idle);
      window.removeEventListener("dragover", handleOver);
      window.removeEventListener("dragover", swallow);
      window.removeEventListener("drop", swallow);
      window.removeEventListener("dragend", stop);
    };
  }, []);

  const dockRef = React.useRef<HTMLDivElement>(null);
  const setDockRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      dockRef.current = node;
      setDroppableRef(node);
    },
    [setDroppableRef]
  );

  /** Dock bounds, measured once per drag instead of per pointer move. */
  const dockRectRef = React.useRef<DOMRect | null>(null);

  useDndMonitor({
    onDragStart() {
      setIsDockHot(false);
      dockRectRef.current = dockRef.current?.getBoundingClientRect() ?? null;
    },
    onDragMove(event) {
      const rect = dockRectRef.current;
      const translated = event.active.rect.current.translated;
      if (!rect || !translated) return;

      // The dragged node's centre stands in for the pointer, which dnd-kit
      // does not expose on drag-move.
      const cx = translated.left + translated.width / 2;
      const cy = translated.top + translated.height / 2;
      const inside =
        cx >= rect.left &&
        cx <= rect.right &&
        cy >= rect.top &&
        cy <= rect.bottom;

      setIsDockHot(inside);
      window.clearTimeout(timers.current.expand);

      if (inside) {
        // Spring-load: a collapsed dock opens after a dwell so it can accept
        // the drop instead of silently rejecting it.
        if (!ctrl.isExpanded) {
          timers.current.expand = window.setTimeout(
            () => ctrl.setIsExpanded(true),
            SPRING_LOAD_DELAY
          );
        }
        return;
      }

      const isMobile = window.innerWidth < 768;
      if (
        ctrl.isExpanded &&
        isDraggingFromDockRef.current &&
        (isMobile || autoCloseDockDesktop)
      ) {
        ctrl.setIsExpanded(false);
      }
    },
    onDragEnd() {
      setIsDockHot(false);
      dockRectRef.current = null;
      window.clearTimeout(timers.current.expand);
    },
    onDragCancel() {
      setIsDockHot(false);
      dockRectRef.current = null;
      window.clearTimeout(timers.current.expand);
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

  const isDropActive = ctrl.isDragOver || isDndOver;

  const open = ctrl.isExpanded;

  const openHeight = "min(20rem, 58vh)";

  return (
    <div
      className="fixed bottom-4 z-rail md:px-4 flex justify-center"
      /* `--dock-inset-left` is the rail's width while it is open on desktop, so
         the dock centres in the content column instead of under the rail. */
      style={{ left: "var(--dock-inset-left, 0px)", right: 0 }}
    >
      {isExternalDrag && (
        /* A tall, full-width spring zone that only exists mid-drag. It widens
           the target from the collapsed bar's 48px to the whole bottom of the
           window, so a drag "in" opens the dock instead of silently missing. */
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-32 z-0"
          onDragEnter={ctrl.handleDragEnter}
          onDragOver={ctrl.handleDragOver}
          onDragLeave={ctrl.handleDragLeave}
          onDrop={ctrl.handleDrop}
        />
      )}

      <div
        ref={setDockRefs}
          className={`
          relative overflow-hidden flex flex-col squircle overscroll-contain
          ${ctrl.isExpanded ? "material" : "material-thin"}
          ${isDropActive ? "dock-drop-active" : isDockHot ? "dock-drop-hot" : ""}
        `}
        style={{
          width: open
            ? "100%"
            : "clamp(220px, calc(100vw - 120px), 310px)",
          maxWidth: "768px",
          height: open ? openHeight : "3rem",
          // Keep the radius constant so the shape does not morph while resizing.
          borderRadius: DOCK_RADIUS,
          transition: open
            ? "width 210ms var(--ease-emphasized), height 260ms var(--ease-emphasized) 120ms"
            : "width 240ms var(--ease-emphasized) 90ms, height 190ms var(--ease-emphasized)",
          willChange: "width, height",
        }}
        onDragEnter={ctrl.handleDragEnter}
        onDragOver={ctrl.handleDragOver}
        onDragLeave={ctrl.handleDragLeave}
        onDrop={ctrl.handleDrop}
      >
        {/* The collapsed bar. `inert` alone removes it from the tab order and
            the accessibility tree; adding `aria-hidden` on top was redundant
            and is what produced the "aria-hidden on an element with a focused
            descendant" warning every time the dock was closed from a focused
            control. */}
        <div
          inert={open || undefined}
          onTouchStart={handleBarTouchStart}
          onTouchMove={handleBarTouchMove}
          style={{ touchAction: "none" }}
          className={`absolute left-0 right-0 top-0 flex items-stretch px-2 py-1.5 h-[3rem] gap-1 transition-opacity duration-200 ${
            !open
              ? "opacity-100 pointer-events-auto delay-75"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <button
            type="button"
            aria-label="Open Library"
            className="flex-1 min-w-0 flex items-center justify-center gap-2 text-subheadline font-medium text-text hover:bg-hover transition-colors duration-150 rounded-control"
            onClick={() => {
              ctrl.setDockSurface("library");
              ctrl.setActiveTab("stash");
              ctrl.setIsExpanded(true);
            }}
          >
            <Library size={17} strokeWidth={2} className="shrink-0" />
            <span className="truncate">Library</span>
          </button>
          <div className="w-px bg-border self-center h-5 shrink-0" />
          <button
            type="button"
            aria-label="Open Settings"
            className="w-10 flex items-center justify-center text-muted hover:text-text hover:bg-hover transition-colors duration-150 rounded-control shrink-0"
            onClick={() => {
              ctrl.setDockSurface("settings");
              ctrl.setIsExpanded(true);
            }}
          >
            <Settings2 size={18} strokeWidth={2} />
          </button>
        </div>

        {/* ── Expanded surfaces ───────────────────────────── */}
        {/* ── Expanded surfaces ────────────────────────────────────────────
            Mounted while the panel is open, and while an item is being dragged
            *out* of it.

            Previously both surfaces stayed in the DOM so the shell could
            "morph" between them. The cost of that trick was that every one of
            the size animation's ~14 frames laid out and painted the entire
            library — the collection tabs, the search field, and forty
            thumbnails — only to clip it to a 3rem bar. Unmounting it means the
            collapse animation only ever lays out the 48px bar itself, and the
            content fades in on open instead.

            The drag case is why this is `open || isDraggingFromDock` and not
            just `open`. Auto-close collapses the panel the moment the pointer
            leaves it, and this subtree is what owns the card that is in flight —
            so collapsing used to unmount the dragged node, and dnd-kit keys its
            registry by node. The drop still resolved to a valid cell, but the
            collision carried no identity, no handler matched, and the drop was
            discarded. Dragging a card out of the dock looked like the image had
            vanished. Holding the subtree for the duration of the gesture costs
            one layout pass of a panel clipped to 48px. */}
        {(open || ctrl.isDraggingFromDock) && (
        <div className="flex flex-col w-full h-full grow-0 shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                      usedImageSrcs={ctrl.usedImageSrcs}
                      onQueryChange={ctrl.setSearchQuery}
                      onModeChange={ctrl.setSearchMode}
                      onSmartAdd={ctrl.handleSmartAdd}
                      autoFocus={autoFocusSearch}
                      searchSource={ctrl.searchSource}
                      onSearchSourceChange={ctrl.setSearchSource}
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
    className="h-12 flex items-center justify-between pl-5 pr-1 sm:pr-2 shrink-0 border-b border-hairline cursor-pointer select-none"
    onClick={onCollapse}
  >
    <span className="text-headline font-semibold text-text">{title}</span>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onCollapse();
      }}
      className="p-1.5 rounded-full hover:bg-hover text-muted hover:text-text transition-colors touch-target"
      title="Collapse"
    >
      <ChevronDown size={19} />
    </button>
  </div>
);
