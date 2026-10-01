import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Controls } from "@/components/Controls";
import { GridSettingsSidebar } from "@/components/GridSettingsSidebar";
import { GridView } from "@/components/views/GridView";
import { ListView } from "@/components/views/ListView";
import { TierListView } from "@/components/views/TierListView";
import { Inbox } from "@/components/Inbox";
import { Library } from "@/components/Library";
import { CommandPalette } from "@/components/CommandPalette";
import { ShortcutsSheet } from "@/components/ShortcutsSheet";
import { ConfirmModal } from "@/components/ConfirmModal";
import { DuplicateModal } from "@/components/DuplicateModal";
import { ExportModal } from "@/components/ExportModal";
import { AboutModal } from "@/components/AboutModal";
import { LoadingScreen } from "@/components/AppLogo";
import { getContrastColor } from "@/theme/palettes";
import type { ImageFormat } from "@/utils/imageUtils";
import { Edit2, LayoutGrid, Download, SlidersHorizontal } from "lucide-react";

import { useAppController } from "@/hooks/useAppController";
import { useModalState } from "@/state/modalState";
import { useStore } from "@/store/useStore";

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};


const ExportModalHost: React.FC<{
  onExportImage: (format: ImageFormat, qualityScale: number) => void;
  onCopyImage: (qualityScale: number) => void;
}> = ({ onExportImage, onCopyImage }) => {
  const isOpen = useModalState((s) => s.isExportOpen);
  const close = useModalState((s) => s.closeExport);
  return (
    <ExportModal
      isOpen={isOpen}
      onClose={close}
      onExportImage={onExportImage}
      onCopyImage={onCopyImage}
    />
  );
};

const ConfirmModalHost: React.FC = () => {
  const confirm = useModalState((s) => s.confirm);
  const close = useModalState((s) => s.closeConfirm);
  return (
    <ConfirmModal
      isOpen={confirm.isOpen}
      title={confirm.title}
      message={confirm.message}
      onConfirm={confirm.onConfirm}
      onCancel={close}
    />
  );
};

const AboutModalHost: React.FC = () => {
  const isOpen = useModalState((s) => s.isAboutOpen);
  const close = useModalState((s) => s.closeAbout);
  return <AboutModal isOpen={isOpen} onClose={close} />;
};

const DuplicateModalHost: React.FC = () => {
  const config = useStore((s) => s.duplicateModalConfig);
  const onConfirm = useStore((s) => s.handleDuplicateConfirm);
  const setConfig = useStore((s) => s.setDuplicateModalConfig);
  return (
    <DuplicateModal
      isOpen={config.isOpen}
      imageSrc={config.imageSrc}
      onConfirm={onConfirm}
      onCancel={() =>
        setConfig({ isOpen: false, imageSrc: null, actionToExecute: null })
      }
    />
  );
};


const AppContent: React.FC = () => {
  const ctrl = useAppController();

  const mainRef = React.useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => setIsScrolled(el.scrollTop > 4);
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const activeRank = ctrl.activeRank;

  if (!activeRank) return <LoadingScreen />;

  const textColor = getContrastColor(activeRank.backgroundColor);
  const mainPadding = activeRank.type === "tierlist" ? "p-2 md:p-8" : "p-4 md:p-8";
  // Padding is expressed as responsive classes rather than read from
  // `window.innerWidth` during render, which never reacted to a resize.
  const containerPaddingClass =
    activeRank.type === "tierlist"
      ? "p-0 md:p-8"
      : activeRank.style === "card"
        ? "p-8"
        : "p-4";

  return (
    <>
      <AnimatePresence mode="wait">
        {(ctrl.showLoader || !ctrl.isLoaded) && <LoadingScreen key="loader" />}
      </AnimatePresence>

      <div className="flex flex-col h-screen overflow-hidden">
        <Controls
          projectName={activeRank.title}
          isScrolled={isScrolled}
          onOpenLibrary={() => ctrl.setIsLibraryOpen(true)}
          onToggleSidebar={() => ctrl.setIsSidebarOpen(!ctrl.isSidebarOpen)}
          onOpenExport={ctrl.openExport}
          isSidebarOpen={ctrl.isSidebarOpen}
          onCreateProject={ctrl.createProjectLikeCurrent}
        />

        {/* One host per dialog, each holding its own subscription. */}
        <ExportModalHost
          onExportImage={ctrl.exportImage}
          onCopyImage={ctrl.copyImage}
        />
        <ConfirmModalHost />
        <AboutModalHost />

        {/* ⌘K and ⌘/ live at the root so they work from any view, and the
            palette receives the commands that need the controller. */}
        <CommandPalette
          extraCommands={[
            {
              id: "projects-sheet",
              label: "Browse all projects",
              section: "Actions",
              keywords: "open switch list library sheet",
              icon: LayoutGrid,
              run: () => ctrl.setIsLibraryOpen(true),
            },
            {
              id: "export",
              label: "Export this project",
              section: "Actions",
              keywords: "download image png save share",
              icon: Download,
              run: () => ctrl.openExport(),
            },
            {
              id: "sidebar",
              label: ctrl.isSidebarOpen
                ? "Hide settings rail"
                : "Show settings rail",
              section: "Actions",
              keywords: "panel sidebar dimensions appearance",
              icon: SlidersHorizontal,
              run: () => ctrl.setIsSidebarOpen((open) => !open),
            },
          ]}
        />
        <ShortcutsSheet
          isOpen={ctrl.isShortcutsOpen}
          onClose={ctrl.closeShortcuts}
        />

        <Library
          isOpen={ctrl.isLibraryOpen}
          onClose={() => ctrl.setIsLibraryOpen(false)}
          ranks={Object.values(ctrl.ranks)}
          activeRankId={ctrl.activeRankId}
          onSelectRank={ctrl.setActiveRankId}
          onDeleteRank={(id) => {
            const rank = ctrl.ranks[id];
            if (!rank) return;
            ctrl.confirmAction(
              `Delete "${rank.title}"?`,
              "This cannot be undone.",
              () => {
                ctrl.handleDeleteRank(id);
              }
            );
          }}
          onNewRank={ctrl.handleNewRank}
          onUpdateRank={ctrl.updateRankById}
        />

        <DuplicateModalHost />

        <div className="flex flex-1 overflow-hidden pt-14">
          <GridSettingsSidebar
            isOpen={ctrl.isSidebarOpen}
            onClose={() => ctrl.setIsSidebarOpen(false)}
            requestConfirm={ctrl.confirmAction}
          />

          <div className="flex-1 flex flex-col min-w-0 relative bg-background">
            <main
              ref={mainRef as React.RefObject<HTMLElement>}
              className={`flex-1 overflow-y-auto scrollbar-ios flex flex-col items-center ${mainPadding} pb-40`}
              onClick={() =>
                ctrl.interactionState && ctrl.setInteractionState(null)
              }
            >
              {/* The board's sheet, hugging the grid so the export frames the
                  board rather than the window. */}
              <div
                ref={ctrl.gridRef}
                className={`relative w-fit max-w-full transition-[background-color,padding] duration-200 ease-standard ${containerPaddingClass}`}
                style={{
                  backgroundColor:
                    activeRank.backgroundColor === "transparent"
                      ? ""
                      : activeRank.backgroundColor,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (ctrl.interactionState) ctrl.setInteractionState(null);
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {(activeRank.showTitle !== false || ctrl.isEditingTitle) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-center mb-6 pb-4 border-b border-border relative flex justify-center items-center overflow-hidden"
                    >
                      {ctrl.isEditingTitle ? (
                        <input
                          ref={ctrl.titleInputRef}
                          type="text"
                          value={ctrl.tempTitle}
                          onChange={(e) => ctrl.setTempTitle(e.target.value)}
                          onBlur={() => {
                            ctrl.setIsEditingTitle(false);
                            if (
                              ctrl.tempTitle.trim() &&
                              ctrl.tempTitle !== activeRank.title
                            ) {
                              ctrl.updateActiveRank({ title: ctrl.tempTitle });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              ctrl.setIsEditingTitle(false);
                              if (
                                ctrl.tempTitle.trim() &&
                                ctrl.tempTitle !== activeRank.title
                              ) {
                                ctrl.updateActiveRank({
                                  title: ctrl.tempTitle,
                                });
                              }
                            }
                          }}
                          autoFocus
                          onFocus={(e) => e.target.select()}
                          className="text-large-title font-bold tracking-[-0.022em] text-center bg-transparent focus:outline-none w-full max-w-2xl placeholder:text-faint animate-in fade-in zoom-in-95"
                          style={{ color: textColor }}
                        />
                      ) : (
                        <h1
                          className="text-large-title font-bold tracking-[-0.022em] cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            ctrl.setTempTitle(activeRank.title);
                            ctrl.setIsEditingTitle(true);
                          }}
                          style={{ color: textColor }}
                        >
                          {activeRank.title}
                        </h1>
                      )}
                      <button
                        onClick={() => {
                          ctrl.setTempTitle(activeRank.title);
                          ctrl.setIsEditingTitle(true);
                        }}
                        className="absolute right-0 p-2 text-muted hover:text-text opacity-0 focus-visible:opacity-100 hover:opacity-100 transition-opacity touch-target"
                        style={{ color: textColor }}
                      >
                        <Edit2 size={16} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeRank.id}-${activeRank.type}`}
                    /* The outgoing view leaves quickly so the incoming one is
                       not delayed, then the new one springs in. `mode="wait"`
                       keeps the two from overlapping mid-flight. */
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { type: "spring", stiffness: 340, damping: 32 },
                    }}
                    exit={{ opacity: 0, y: -6, transition: { duration: 0.14 } }}
                  >
                    {activeRank.type === "tierlist" ? (
                      <TierListView />
                    ) : activeRank.type === "list" ? (
                      <ListView />
                    ) : (
                      <GridView />
                    )}
                  </motion.div>
                </AnimatePresence>
                {(activeRank.showWatermark || activeRank.showDate) && (
                  <div className="flex justify-between items-end px-2 mt-8 pt-4 border-t border-hairline opacity-45">
                    {activeRank.showWatermark && (
                      <div
                        className="text-caption-2 font-semibold uppercase tracking-[0.08em]"
                        style={{ color: textColor }}
                      >
                        Ranku
                      </div>
                    )}
                    {activeRank.showDate && (
                      <div
                        className="text-caption-2 font-medium tabular-nums"
                        style={{ color: textColor }}
                      >
                        {new Date().toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </main>

            <Inbox
              requestConfirm={ctrl.confirmAction}
              onOpenAbout={ctrl.openAbout}
            />
          </div>
        </div>
      </div>
    </>
  );
};
