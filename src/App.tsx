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
import { downloadGrid, copyGrid } from "@/utils/imageUtils";
import { cleanupOldCache } from "@/utils/imageCache";
import { getContrastColor } from "@/theme/palettes";
import { Edit2 } from "lucide-react";
import {
  selectActiveRankId,
  selectActiveRank,
  selectRanks,
} from "@/store/selectors";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";
import { useAppTheme } from "@/hooks/useAppTheme";

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

  useAppTheme(isLoaded);
  useGlobalShortcuts(setIsEditingTitle);

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
                          className="text-4xl md:text-5xl font-black text-center bg-transparent focus:outline-none w-full max-w-2xl placeholder-muted/40 animate-in fade-in zoom-in-95 duration-200"
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
