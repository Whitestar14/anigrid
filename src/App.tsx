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

import { useAppController } from "@/hooks/useAppController";

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

const AppContent: React.FC = () => {
  const ctrl = useAppController();

  const activeRank = ctrl.activeRank;

  if (!activeRank) return <LoadingScreen />;

  const textColor = getContrastColor(activeRank.backgroundColor);
  const mainPadding = activeRank.type === "tierlist" ? "p-2 md:p-8" : "p-4 md:p-8";
  const containerPadding = activeRank.type === "tierlist" ? (window.innerWidth < 768 ? "0px" : "32px") : (activeRank.style === "card" ? "32px" : "16px");

  return (
    <>
      <AnimatePresence mode="wait">
        {(ctrl.showLoader || !ctrl.isLoaded) && <LoadingScreen key="loader" />}
      </AnimatePresence>

      <div className="flex flex-col h-screen overflow-hidden">
        <Controls
          projectName={activeRank.title}
          onOpenLibrary={() => ctrl.setIsLibraryOpen(true)}
          onToggleSidebar={() => ctrl.setIsSidebarOpen(!ctrl.isSidebarOpen)}
          onOpenExport={() => ctrl.setIsExportModalOpen(true)}
          isSidebarOpen={ctrl.isSidebarOpen}
        />

        <ExportModal
          isOpen={ctrl.isExportModalOpen}
          onClose={() => ctrl.setIsExportModalOpen(false)}
          onExportImage={ctrl.exportImage}
          onCopyImage={ctrl.copyImage}
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
            ctrl.confirmAction(`Delete "${rank.title}"?`, "This cannot be undone.", () => {
              ctrl.handleDeleteRank(id);
            });
          }}
          onNewRank={ctrl.handleNewRank}
          onUpdateRank={ctrl.updateRankById}
        />

        <ConfirmModal
          isOpen={ctrl.modalConfig.isOpen}
          title={ctrl.modalConfig.title}
          message={ctrl.modalConfig.message}
          onConfirm={ctrl.modalConfig.onConfirm}
          onCancel={() => ctrl.setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        />

        <DuplicateModal
          isOpen={ctrl.duplicateModalConfig.isOpen}
          imageSrc={ctrl.duplicateModalConfig.imageSrc}
          onConfirm={ctrl.handleDuplicateConfirm}
          onCancel={() => ctrl.setDuplicateModalConfig({ isOpen: false, imageSrc: null, actionToExecute: null })}
        />

        <AboutModal isOpen={ctrl.isAboutModalOpen} onClose={() => ctrl.setIsAboutModalOpen(false)} />

        <div className="flex flex-1 overflow-hidden pt-14">
          <GridSettingsSidebar
            isOpen={ctrl.isSidebarOpen}
            onClose={() => ctrl.setIsSidebarOpen(false)}
            onToggle={() => ctrl.setIsSidebarOpen(!ctrl.isSidebarOpen)}
            requestConfirm={ctrl.confirmAction}
          />

          <div className="flex-1 flex flex-col min-w-0 relative bg-background">
            <main
              className={`flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center ${mainPadding} pb-40`}
              onClick={() => ctrl.interactionState && ctrl.setInteractionState(null)}
            >
              <div
                ref={ctrl.gridRef}
                className="relative transition-all duration-200 shadow-2xl"
                style={{
                  width: "fit-content",
                  minWidth: activeRank.type === "list" ? "100%" : (activeRank.type === "tierlist" ? "98%" : "auto"),
                  maxWidth: activeRank.type === "tierlist" ? "1200px" : "none",
                  backgroundColor: activeRank.backgroundColor === "transparent" ? "" : activeRank.backgroundColor,
                  padding: containerPadding,
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
                      animate={{ opacity: 1, height: 120 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-center mb-8 pb-4 border-b border-border relative flex justify-center items-center overflow-hidden"
                    >
                      {ctrl.isEditingTitle ? (
                        <input
                          ref={ctrl.titleInputRef}
                          type="text"
                          value={ctrl.tempTitle}
                          onChange={(e) => ctrl.setTempTitle(e.target.value)}
                          onBlur={() => {
                            ctrl.setIsEditingTitle(false);
                            if (ctrl.tempTitle.trim() && ctrl.tempTitle !== activeRank.title) {
                              ctrl.updateActiveRank({ title: ctrl.tempTitle });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              ctrl.setIsEditingTitle(false);
                              if (ctrl.tempTitle.trim() && ctrl.tempTitle !== activeRank.title) {
                                ctrl.updateActiveRank({ title: ctrl.tempTitle });
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
                    key={`${activeRank.id}-${activeRank.type}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    {activeRank.type === "tierlist" ? <TierListView /> : activeRank.type === "list" ? <ListView /> : <GridView />}
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
              requestConfirm={ctrl.confirmAction}
              onOpenAbout={() => ctrl.setIsAboutModalOpen(true)}
            />
          </div>
        </div>
      </div>
    </>
  );
};
