import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
import { AboutModal } from "@/components/AboutModal";
import { LoadingScreen } from "@/components/AppLogo";
import { useToast } from "@/context/ToastContext";
import { readFileAsDataURL, downloadGrid, copyGrid } from "@/utils/imageUtils";
import { cleanupOldCache } from "@/utils/imageCache";
import { THEME_PALETTES, getContrastColor } from "@/theme/palettes";
import { Edit2 } from "lucide-react";
import {
  selectTheme,
  selectActiveRankId,
  selectActiveRank,
  selectRanks,
  selectPreferences
} from "@/store/selectors";

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

const AppContent: React.FC = () => {
  const addToast = useToast();
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const theme = useStore(selectTheme);
  const preferences = useStore(selectPreferences);
  const reduceGlassEffects = preferences.reduceGlassEffects ?? false;
  const activeRankId = useStore(selectActiveRankId);
  const activeRank = useStore(selectActiveRank);
  const ranks = useStore(selectRanks);
  const interactionState = useStore((s) => s.interactionState);
  const duplicateModalConfig = useStore((s) => s.duplicateModalConfig);
  const setInteractionState = useStore((s) => s.setInteractionState);
  const updateActiveRank = useStore((s) => s.updateActiveRank);
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
  }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });

  const gridRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

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

  useLayoutEffect(() => {
    if (isLoaded && theme) {
      const root = document.documentElement;

      const isDark = theme.isDark ?? true;
      if (isDark) {
        root.classList.remove("light");
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
      }

      root.style.setProperty("--color-primary", theme.accentColor);
      const paletteId = theme.paletteId || (isDark ? "ios-dark" : "ios-light");
      const palette =
        THEME_PALETTES.find((p) => p.id === paletteId) || THEME_PALETTES[0];

      root.style.setProperty("--color-background", palette.colors.background);
      root.style.setProperty("--color-surface", palette.colors.surface);
      root.style.setProperty("--color-border", palette.colors.border);
      root.style.setProperty("--color-text", palette.colors.text);
      root.style.setProperty("--color-muted", palette.colors.muted);
      root.style.setProperty("--color-hover", palette.colors.hover);
      root.style.setProperty("--color-overlay", palette.colors.overlay);
    }
  }, [theme, isLoaded]);

  useLayoutEffect(() => {
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

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          useStore.temporal.getState().redo();
        } else {
          useStore.temporal.getState().undo();
        }
        return;
      }

      // Arrow navigation for grid/list
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (st.interactionState?.type === "cell" && rank) {
          e.preventDefault();
          const maxCells = rank.cells.length;
          const cols = rank.mode === 'grid' ? rank.config.cols : 1;
          let newIndex = st.interactionState.index;

          if (e.key === 'ArrowRight') newIndex++;
          if (e.key === 'ArrowLeft') newIndex--;
          if (e.key === 'ArrowDown') newIndex += cols;
          if (e.key === 'ArrowUp') newIndex -= cols;

          if (newIndex >= 0 && newIndex < maxCells) {
            st.setInteractionState({ type: "cell", index: newIndex });
          }
          return;
        }
      }

      // Quick Clear
      if (e.key === "Backspace" || e.key === "Delete") {
        if (st.interactionState?.type === "cell" && rank) {
          e.preventDefault();
          st.handleCellClear(st.interactionState.index);
          return;
        }
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

  if (!activeRank) return <LoadingScreen />;

  const textColor = getContrastColor(activeRank.backgroundColor);
  const mainPadding = activeRank.type === "tierlist" ? "p-2 md:p-8" : "p-4 md:p-8";
  const containerPadding = activeRank.type === "tierlist" ? (window.innerWidth < 768 ? "0px" : "32px") : (activeRank.style === "card" ? "32px" : "16px");

  return (
    <>
      <AnimatePresence mode="wait">
        {(showLoader || !isLoaded) && <LoadingScreen key="loader" />}
      </AnimatePresence>

      <div className="flex flex-col h-screen overflow-hidden">
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
                await downloadGrid(gridRef.current, activeRank.title, fmt, qualityScale);
                addToast("success", `Exported as ${fmt.toUpperCase()}`);
              } catch (error) {
                addToast("error", error instanceof Error ? error.message : "Export failed");
              }
            }
          }}
          onCopyImage={async (qualityScale) => {
            if (gridRef.current) {
              try {
                await copyGrid(gridRef.current, qualityScale);
                addToast("success", "Copied to clipboard");
              } catch (error) {
                addToast("error", error instanceof Error ? error.message : "Copy failed");
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
          onCancel={() => setDuplicateModalConfig({ isOpen: false, imageSrc: null, actionToExecute: null })}
        />

        <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />

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
              onClick={() => interactionState && setInteractionState(null)}
            >
              <div
                ref={gridRef}
                className="relative transition-all duration-200 shadow-2xl"
                style={{
                  width: "fit-content",
                  minWidth: activeRank.mode === "list" ? "100%" : (activeRank.type === "tierlist" ? "98%" : "auto"),
                  maxWidth: activeRank.type === "tierlist" ? "1200px" : "none",
                  backgroundColor: activeRank.backgroundColor === "transparent" ? "" : activeRank.backgroundColor,
                  padding: containerPadding,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (interactionState) setInteractionState(null);
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {(activeRank.showTitle !== false || isEditingTitle) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 120 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-center mb-8 pb-4 border-b border-border relative flex justify-center items-center overflow-hidden"
                    >
                      {isEditingTitle ? (
                        <input
                          ref={titleInputRef}
                          type="text"
                          value={tempTitle}
                          onChange={(e) => setTempTitle(e.target.value)}
                          onBlur={() => {
                            setIsEditingTitle(false);
                            if (tempTitle.trim() && tempTitle !== activeRank.title) {
                              updateActiveRank({ title: tempTitle });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setIsEditingTitle(false);
                              if (tempTitle.trim() && tempTitle !== activeRank.title) {
                                updateActiveRank({ title: tempTitle });
                              }
                            }
                          }}
                          autoFocus
                          onFocus={(e) => e.target.select()}
                          className="text-4xl md:text-5xl font-black text-center bg-transparent border-b-2 border-primary focus:outline-none w-full max-w-2xl placeholder-muted/40 animate-in fade-in zoom-in-95 duration-200"
                          style={{ color: textColor }}
                        />
                      ) : (
                        <h1
                          className="text-4xl md:text-5xl font-black cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            setTempTitle(activeRank.title);
                            setIsEditingTitle(true);
                          }}
                          style={{ color: textColor }}
                        >
                          {activeRank.title}
                        </h1>
                      )}
                      <button
                        onClick={() => {
                          setTempTitle(activeRank.title);
                          setIsEditingTitle(true);
                        }}
                        className="absolute right-0 p-2 text-muted hover:text-text opacity-0 hover:opacity-100 transition-all"
                        style={{ color: textColor }}
                      >
                        <Edit2 size={16} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeRank.id}-${activeRank.type}-${activeRank.mode}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    {activeRank.type === "tierlist" ? <TierListView /> : activeRank.mode === "list" ? <ListView /> : <GridView />}
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-between items-end opacity-30 px-2 mt-8 pt-4 border-t border-border">
                  {activeRank.showWatermark !== false ? (
                    <div className="text-[10px] font-mono font-bold tracking-widest uppercase" style={{ color: textColor }}>Ranku</div>
                  ) : <div />}
                  {activeRank.showDate !== false && (
                    <div className="text-[10px] font-mono font-bold tracking-widest uppercase" style={{ color: textColor }}>
                      {new Date().toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </main>

            <Inbox
              requestConfirm={confirmAction}
              onOpenAbout={() => setIsAboutModalOpen(true)}
            />
          </div>
        </div>
      </div>
    </>
  );
};
