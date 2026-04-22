import React, { useState, useRef, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Controls } from "@/components/Controls";
import { GridSettingsSidebar } from "@/components/GridSettingsSidebar";
import { GridView } from "@/components/views/GridView";
import { ListView } from "@/components/views/ListView";
import { TierListView } from "@/components/views/TierListView";
import { Inbox } from "@/components/Inbox";
import { Library } from "@/components/Library";
import { ConfirmModal } from "@/components/ConfirmModal";
import { DuplicateModal } from "@/components/DuplicateModal";
import { ExportModal } from "@/components/ExportModal";
import { useToast } from "@/context/ToastContext";
import { readFileAsDataURL, downloadGrid } from "@/utils/imageUtils";
import { cleanupOldCache } from "@/utils/imageCache";
import { THEME_PALETTES, getContrastColor } from "@/theme/palettes";
import { Edit2, Heart, Zap } from "lucide-react";
import { useBoardCellInteraction } from "@/hooks/useBoardCellInteraction";

export const App: React.FC = () => {
  const addToast = useToast();
  const onBoardCellInteract = useBoardCellInteraction();
  const theme = useStore((s) => s.theme);
  const reduceGlassEffects = useStore(
    (s) => s.preferences.reduceGlassEffects ?? false,
  );
  const activeRankId = useStore((s) => s.activeRankId);
  const activeRank = useStore((s) => s.ranks[s.activeRankId]);
  const ranks = useStore((s) => s.ranks);
  const interactionState = useStore((s) => s.interactionState);
  const duplicateModalConfig = useStore((s) => s.duplicateModalConfig);
  const setInteractionState = useStore((s) => s.setInteractionState);
  const updateActiveRank = useStore((s) => s.updateActiveRank);
  const handleUpdateTierRows = useStore((s) => s.handleUpdateTierRows);
  const handleInboxDropToTier = useStore((s) => s.handleInboxDropToTier);
  const handleInboxDropToTierMulti = useStore(
    (s) => s.handleInboxDropToTierMulti,
  );
  const handleSearchDropToTier = useStore((s) => s.handleSearchDropToTier);
  const handleTierMoveToInbox = useStore((s) => s.handleTierMoveToInbox);
  const handleInternalTierMove = useStore((s) => s.handleInternalTierMove);
  const handleCellClear = useStore((s) => s.handleCellClear);
  const handleSwapCells = useStore((s) => s.handleSwapCells);
  const handleInboxDrop = useStore((s) => s.handleInboxDrop);
  const handleInboxDropMulti = useStore((s) => s.handleInboxDropMulti);
  const handleSearchDrop = useStore((s) => s.handleSearchDrop);
  const handleMoveToInbox = useStore((s) => s.handleMoveToInbox);
  const handleUpdateCell = useStore((s) => s.handleUpdateCell);
  const setActiveRankId = useStore((s) => s.setActiveRankId);
  const handleDeleteRank = useStore((s) => s.handleDeleteRank);
  const handleNewRank = useStore((s) => s.handleNewRank);
  const updateRankById = useStore((s) => s.updateRankById);
  const handleDuplicateConfirm = useStore((s) => s.handleDuplicateConfirm);
  const setDuplicateModalConfig = useStore((s) => s.setDuplicateModalConfig);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const [internalClipboard, setInternalClipboard] = useState<string | null>(
    null,
  );

  // Modals
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const gridRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Wrapper functions to handle File → DataURL conversion
  const handleCellUploadWithConversion = async (index: number, file: File) => {
    try {
      const dataUrl = await readFileAsDataURL(file);
      useStore.getState().handleCellUpload(index, dataUrl);
    } catch (error) {
      console.error("Failed to upload image:", error);
      addToast("error", "Failed to upload image");
    }
  };

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
    useStore.persist.onFinishHydration(() => setIsLoaded(true));
    if (useStore.persist.hasHydrated()) {
      setIsLoaded(true);
    }
    cleanupOldCache();
  }, []);

  useEffect(() => {
    if (isLoaded && theme) {
      const root = document.documentElement;
      root.style.setProperty("--color-primary", theme.accentColor);
      const paletteId = theme.paletteId || "ios-dark";
      const palette =
        THEME_PALETTES.find((p) => p.id === paletteId) || THEME_PALETTES[0];
      root.style.setProperty("--color-background", palette.colors.background);
      root.style.setProperty("--color-surface", palette.colors.surface);
      root.style.setProperty("--color-border", palette.colors.border);
      root.style.setProperty("--color-text", palette.colors.text);
      root.style.setProperty("--color-muted", palette.colors.muted);
      root.style.setProperty("--color-hover", palette.colors.hover);
      root.style.setProperty("--color-overlay", palette.colors.overlay);
      const isLight = ["cloud", "dawn", "latte"].includes(palette.id);
      if (isLight) {
        root.classList.remove("dark");
        root.classList.add("light");
      } else {
        root.classList.remove("light");
        root.classList.add("dark");
      }
    }
  }, [theme, isLoaded]);

  useEffect(() => {
    document.documentElement.toggleAttribute(
      "data-reduce-glass",
      reduceGlassEffects,
    );
  }, [reduceGlassEffects]);

  // Global Paste
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA"
      )
        return;

      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            try {
              const src = await readFileAsDataURL(blob);
              const st = useStore.getState();
              if (st.interactionState?.type === "cell") {
                st.handleCellUpload(st.interactionState.index, src);
              } else {
                const activeColId =
                  st.inbox.activeCollectionId === "all-images"
                    ? st.inbox.collections[0].id
                    : st.inbox.activeCollectionId;
                st.handleAddToCollection(src, activeColId);
              }
            } catch (err) {
              console.error(err);
            }
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA"
      )
        return;

      const st = useStore.getState();
      const rank = st.ranks[st.activeRankId];

      if (e.key === "Escape") {
        st.setInteractionState(null);
        setIsEditingTitle(false);
        return;
      }

      // Copy/Paste internal
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        if (st.interactionState?.type === "cell" && rank) {
          const cell = rank.cells[st.interactionState.index];
          if (cell && cell.imageSrc) {
            setInternalClipboard(cell.imageSrc);
          }
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        if (
          st.interactionState?.type === "cell" &&
          rank &&
          internalClipboard
        ) {
          st.handleCellUpload(
            st.interactionState.index,
            internalClipboard,
          );
        }
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (st.interactionState?.type === "cell" && rank) {
          st.handleCellClear(st.interactionState.index);
          st.setInteractionState(null);
        }
        // For Tier Item delete
        if (st.interactionState?.type === "tier-item" && rank) {
          st.handleTierItemRemove(
            st.interactionState.rowId,
            st.interactionState.itemId,
          );
          st.setInteractionState(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [internalClipboard]);

  const confirmAction = (
    title: string,
    message: string,
    action: () => void,
  ) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        action();
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  if (!isLoaded || !activeRank)
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="grid grid-cols-2 gap-2 w-16 h-16">
          <div className="bg-surface border border-border rounded-full flex items-center justify-center aspect-square">
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce delay-0"></div>
          </div>
          <div className="bg-surface border border-border rounded-lg flex items-center justify-center aspect-square">
            <Heart
              size={20}
              className="text-primary fill-primary animate-pulse delay-75"
            />
          </div>
          <div className="bg-surface border border-border rounded-lg flex items-center justify-center aspect-square">
            <Zap
              size={20}
              className="text-text fill-text animate-pulse delay-150"
            />
          </div>
          <div className="bg-primary rounded-[12px] animate-pulse delay-200 aspect-square"></div>
        </div>
        <span className="text-muted font-bold tracking-widest text-xs mt-4">
          ANIGRID
        </span>
      </div>
    );

  const textColor = getContrastColor(activeRank.backgroundColor);

  // Responsive padding logic: Less padding on mobile for tier lists to maximize width
  const mainPadding =
    activeRank.type === "tierlist" ? "p-2 md:p-8" : "p-4 md:p-8";
  // Inner container padding: Default to 0 for Tier Lists on mobile to go edge-to-edge
  const containerPadding =
    activeRank.type === "tierlist"
      ? window.innerWidth < 768
        ? "0px"
        : "32px"
      : activeRank.style === "card"
        ? "32px"
        : "16px";

  const handleCellDownload = async (index: number) => {
    const cell = activeRank.cells[index];
    if (!cell || !cell.imageSrc) return;

    const link = document.createElement("a");
    link.href = cell.imageSrc;
    link.download = `${activeRank.title}-cell-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-[100dvh] bg-background text-text font-sans selection:bg-primary/30 flex flex-col overflow-hidden relative">
      <Controls
        projectName={activeRank.title}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenExport={() => setIsExportModalOpen(true)}
        isSidebarOpen={isSidebarOpen}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportImage={async (fmt, qualityScale) => {
          if (gridRef.current) {
            try {
              await downloadGrid(
                gridRef.current,
                activeRank.title,
                fmt,
                qualityScale,
              );
              addToast("success", `Exported as ${fmt.toUpperCase()}`);
            } catch (error) {
              addToast(
                "error",
                error instanceof Error ? error.message : "Export failed",
              );
            }
          }
        }}
      />

      <Library
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        ranks={Object.values(ranks)}
        activeRankId={activeRankId}
        onSelectRank={setActiveRankId}
        onDeleteRank={(id) => {
          const rank = ranks[id];
          if (!rank) return;
          confirmAction(`Delete "${rank.title}"?`, "This cannot be undone.", () => {
            handleDeleteRank(id);
          });
        }}
        onNewRank={handleNewRank}
        onUpdateRank={updateRankById}
      />

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      <DuplicateModal
        isOpen={duplicateModalConfig.isOpen}
        imageSrc={duplicateModalConfig.imageSrc}
        onConfirm={handleDuplicateConfirm}
        onCancel={() =>
          setDuplicateModalConfig({
            isOpen: false,
            imageSrc: null,
            actionToExecute: null,
          })
        }
      />

      <div className="flex flex-1 overflow-hidden pt-14">
        <GridSettingsSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          requestConfirm={confirmAction}
        />

        <div className="flex-1 flex flex-col min-w-0 relative bg-background">
          <main
            className={`flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center ${mainPadding} pb-40`}
            onClick={() =>
              interactionState && setInteractionState(null)
            }
          >
            <div
              ref={gridRef}
              className="relative transition-all duration-200 shadow-2xl"
              style={{
                width: "fit-content",
                minWidth:
                  activeRank.mode === "list"
                    ? "100%"
                    : activeRank.type === "tierlist"
                      ? "98%"
                      : "auto",
                maxWidth: activeRank.type === "tierlist" ? "1200px" : "none",
                backgroundColor:
                  activeRank.backgroundColor === "transparent"
                    ? ""
                    : activeRank.backgroundColor,
                padding: containerPadding,
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (interactionState) setInteractionState(null);
              }}
            >
              {(activeRank.showTitle !== false || isEditingTitle) && (
                <div className="text-center mb-8 pb-4 border-b border-white/5 relative">
                  {isEditingTitle ? (
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onBlur={() => {
                        setIsEditingTitle(false);
                        if (
                          tempTitle.trim() &&
                          tempTitle !== activeRank.title
                        ) {
                          updateActiveRank({ title: tempTitle });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setIsEditingTitle(false);
                          if (
                            tempTitle.trim() &&
                            tempTitle !== activeRank.title
                          ) {
                            updateActiveRank({ title: tempTitle });
                          }
                        }
                      }}
                      autoFocus
                      onFocus={(e) => e.target.select()}
                      className="text-4xl md:text-5xl font-black text-center bg-transparent border-b-2 border-primary focus:outline-none w-full max-w-2xl placeholder-white/20 animate-in fade-in duration-200"
                      style={{ color: textColor }}
                    />
                  ) : (
                    <h1
                      onClick={() => {
                        setTempTitle(activeRank.title);
                        setIsEditingTitle(true);
                      }}
                      className="text-4xl md:text-5xl font-black tracking-tighter cursor-pointer hover:text-primary transition-colors inline-flex items-center gap-3 group/title animate-in fade-in duration-200"
                      style={{ color: textColor }}
                    >
                      {activeRank.title}
                      <Edit2
                        size={20}
                        className="text-muted opacity-0 group-hover/title:opacity-100 transition-opacity"
                      />
                    </h1>
                  )}
                </div>
              )}

              {activeRank.type === "tierlist" ? (
                <TierListView
                  rank={activeRank}
                  onUpdateTierRows={handleUpdateTierRows}
                  onInboxDrop={(itemId, colId, rowId, idx) => {
                    handleInboxDropToTier(itemId, colId, rowId, idx);
                    setInteractionState(null);
                  }}
                  onInboxDropMulti={(itemIds, colId, rowId, idx) => {
                    handleInboxDropToTierMulti(
                      itemIds,
                      colId,
                      rowId,
                      idx,
                    );
                    setInteractionState(null);
                  }}
                  onSearchDrop={(imageSrc, rowId, idx) => {
                    handleSearchDropToTier(imageSrc, rowId, idx);
                    setInteractionState(null);
                  }}
                  onMoveToInbox={handleTierMoveToInbox}
                  interactionState={interactionState}
                  onInteract={(rowId, itemId) =>
                    setInteractionState({
                      type: "tier-item",
                      rowId,
                      itemId,
                    })
                  }
                  onInternalMove={(srcRow, srcItem, tgtRow, tgtIdx) => {
                    handleInternalTierMove(
                      srcRow,
                      srcItem,
                      tgtRow,
                      tgtIdx,
                    );
                    setInteractionState(null);
                  }}
                />
              ) : activeRank.mode === "list" ? (
                <ListView
                  rank={activeRank}
                  onUpload={handleCellUploadWithConversion}
                  onClear={handleCellClear}
                  onSwap={handleSwapCells}
                  onInboxDrop={handleInboxDrop}
                  onInboxDropMulti={handleInboxDropMulti}
                  onSearchDrop={handleSearchDrop}
                  onMoveToInbox={handleMoveToInbox}
                  onUpdateCell={handleUpdateCell}
                  interactionState={interactionState}
                  onInteract={onBoardCellInteract}
                />
              ) : (
                <GridView
                  rank={activeRank}
                  onUpload={handleCellUploadWithConversion}
                  onClear={handleCellClear}
                  onSwap={handleSwapCells}
                  onInboxDrop={handleInboxDrop}
                  onInboxDropMulti={handleInboxDropMulti}
                  onSearchDrop={handleSearchDrop}
                  onDownloadSingle={handleCellDownload}
                  onUpdateCell={handleUpdateCell}
                  interactionState={interactionState}
                  onInteract={onBoardCellInteract}
                />
              )}

              <div className="flex justify-between items-end opacity-30 px-2 mt-8 pt-4 border-t border-white/5">
                <div
                  className="text-[10px] font-mono font-bold tracking-widest uppercase"
                  style={{ color: textColor }}
                >
                  AniGrid
                </div>

                {activeRank.showDate !== false && (
                  <div
                    className="text-[10px] font-mono font-bold tracking-widest uppercase"
                    style={{ color: textColor }}
                  >
                    {new Date().toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </main>

          <Inbox requestConfirm={confirmAction} />
        </div>
      </div>
    </div>
  );
};
