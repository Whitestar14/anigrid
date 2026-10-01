import { useState, useRef, useEffect, useCallback } from "react";
import { useStore } from "@/store/useStore";
import { useToast } from "@/context/ToastContext";
import { downloadGrid, copyGrid } from "@/utils/imageUtils";
import { cleanupOldCache } from "@/utils/imageCache";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";
import { useCommandState } from "@/state/commandState";
import { useModalState } from "@/state/modalState";
import { useAppTheme } from "@/hooks/useAppTheme";
import { selectActiveRankId, selectActiveRank, selectRanks } from "@/store/selectors";
import { runActivity } from "@/state/activityState";

export function useAppController() {
  const addToast = useToast();
  
  // Local UI State
  const [showLoader, setShowLoader] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");

  const openExport = useModalState((s) => s.openExport);
  const openAbout = useModalState((s) => s.openAbout);
  const requestConfirm = useModalState((s) => s.requestConfirm);

  /* The export sheet. `downloadGrid`/`copyGrid` narrow it to the board's own
     width for the duration of the capture, so the exported image wraps the
     artwork instead of the window. */
  const gridRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Global State
  const activeRankId = useStore(selectActiveRankId);
  const activeRank = useStore(selectActiveRank);
  const ranks = useStore(selectRanks);
  const interactionState = useStore((s) => s.interactionState);
  
  // Actions
  const setInteractionState = useStore((s) => s.setInteractionState);
  const updateActiveRank = useStore((s) => s.updateActiveRank);
  const setActiveRankId = useStore((s) => s.setActiveRankId);
  const handleDeleteRank = useStore((s) => s.handleDeleteRank);
  const handleNewRank = useStore((s) => s.handleNewRank);
  const handleNewRankLikeCurrent = useStore((s) => s.handleNewRankLikeCurrent);
  const updateRankById = useStore((s) => s.updateRankById);

  // ⌘/ cheat sheet, owned by the command store so the keyboard hook can open it.
  const isShortcutsOpen = useCommandState((s) => s.isShortcutsOpen);
  const closeShortcuts = useCommandState((s) => s.closeShortcuts);

  // Lifecycles
  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
    useStore.persist.onFinishHydration(() => setIsLoaded(true));
    if (useStore.persist.hasHydrated()) {
      setIsLoaded(true);
    }

    const failsafe = window.setTimeout(() => setIsLoaded(true), 4000);

    cleanupOldCache();
    return () => window.clearTimeout(failsafe);
  }, []);

  useAppTheme(isLoaded);
  useGlobalShortcuts({
    setIsEditingTitle,
    onToggleSidebar: () => setIsSidebarOpen((open) => !open),
    onExport: openExport,
  });

  /** Stable for the life of the app, because the store's action is. */
  const confirmAction = requestConfirm;

  const createProjectLikeCurrent = useCallback(() => {
    void runActivity(
      "New project",
      async () => {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const id = handleNewRankLikeCurrent();
        if (!id) throw new Error("No project to copy");
        return id;
      },
      {
        successLabel: "Project created",
        errorLabel: "Could not create project",
      }
    );
  }, [handleNewRankLikeCurrent]);

  /**
   * Export reports through the island, which is determinate where it can be.
   * The toast is kept for the *reason* on failure, since the island has room for
   * a status but not for an explanation.
   */
  const exportImage = async (fmt: "png" | "jpeg" | "webp", qualityScale: number) => {
    const element = gridRef.current;
    if (!element || !activeRank) return;

    await runActivity(
      `Exporting ${fmt.toUpperCase()}`,
      async () => {
        try {
          await downloadGrid(element, activeRank.title, fmt, qualityScale);
        } catch (error) {
          addToast(
            "error",
            error instanceof Error ? error.message : "Export failed"
          );
          throw error;
        }
      },
      { successLabel: `Exported as ${fmt.toUpperCase()}`, errorLabel: "Export failed" }
    );
  };

  const copyImage = async (qualityScale: number) => {
    const element = gridRef.current;
    if (!element) return;

    await runActivity(
      "Copying image",
      async () => {
        try {
          await copyGrid(element, qualityScale);
        } catch (error) {
          addToast(
            "error",
            error instanceof Error ? error.message : "Copy failed"
          );
          throw error;
        }
      },
      { successLabel: "Copied to clipboard", errorLabel: "Copy failed" }
    );
  };

  return {
    // State
    showLoader,
    isLoaded,
    isLibraryOpen,
    isSidebarOpen,
    isEditingTitle,
    tempTitle,
    gridRef,
    titleInputRef,

    // Store state
    activeRankId,
    activeRank,
    ranks,
    interactionState,

    // Setters
    setIsLibraryOpen,
    setIsSidebarOpen,
    openExport,
    openAbout,
    setIsEditingTitle,
    setTempTitle,
    isShortcutsOpen,
    closeShortcuts,
    setInteractionState,
    updateActiveRank,
    setActiveRankId,
    handleDeleteRank,
    handleNewRank,
    updateRankById,

    // Methods
    confirmAction,
    exportImage,
    copyImage,
    createProjectLikeCurrent,
  };
}
