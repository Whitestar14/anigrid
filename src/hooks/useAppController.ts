import { useState, useRef, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { useToast } from "@/context/ToastContext";
import { downloadGrid, copyGrid } from "@/utils/imageUtils";
import { cleanupOldCache } from "@/utils/imageCache";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";
import { useAppTheme } from "@/hooks/useAppTheme";
import { selectActiveRankId, selectActiveRank, selectRanks } from "@/store/selectors";

export function useAppController() {
  const addToast = useToast();
  
  // Local UI State
  const [showLoader, setShowLoader] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const gridRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Global State
  const activeRankId = useStore(selectActiveRankId);
  const activeRank = useStore(selectActiveRank);
  const ranks = useStore(selectRanks);
  const interactionState = useStore((s) => s.interactionState);
  const duplicateModalConfig = useStore((s) => s.duplicateModalConfig);
  
  // Actions
  const setInteractionState = useStore((s) => s.setInteractionState);
  const updateActiveRank = useStore((s) => s.updateActiveRank);
  const setActiveRankId = useStore((s) => s.setActiveRankId);
  const handleDeleteRank = useStore((s) => s.handleDeleteRank);
  const handleNewRank = useStore((s) => s.handleNewRank);
  const updateRankById = useStore((s) => s.updateRankById);
  const handleDuplicateConfirm = useStore((s) => s.handleDuplicateConfirm);
  const setDuplicateModalConfig = useStore((s) => s.setDuplicateModalConfig);

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
    cleanupOldCache();
  }, []);

  useAppTheme(isLoaded);
  useGlobalShortcuts(setIsEditingTitle);

  // Handlers
  const confirmAction = (title: string, message: string, action: () => void) => {
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

  const exportImage = async (fmt: "png" | "jpeg" | "webp", qualityScale: number) => {
    if (gridRef.current && activeRank) {
      try {
        await downloadGrid(gridRef.current, activeRank.title, fmt, qualityScale);
        addToast("success", `Exported as ${fmt.toUpperCase()}`);
      } catch (error) {
        addToast("error", error instanceof Error ? error.message : "Export failed");
      }
    }
  };

  const copyImage = async (qualityScale: number) => {
    if (gridRef.current) {
      try {
        await copyGrid(gridRef.current, qualityScale);
        addToast("success", "Copied to clipboard");
      } catch (error) {
        addToast("error", error instanceof Error ? error.message : "Copy failed");
      }
    }
  };

  return {
    // State
    showLoader,
    isLoaded,
    isLibraryOpen,
    isSidebarOpen,
    isExportModalOpen,
    isAboutModalOpen,
    isEditingTitle,
    tempTitle,
    modalConfig,
    gridRef,
    titleInputRef,

    // Store state
    activeRankId,
    activeRank,
    ranks,
    interactionState,
    duplicateModalConfig,

    // Setters
    setIsLibraryOpen,
    setIsSidebarOpen,
    setIsExportModalOpen,
    setIsAboutModalOpen,
    setIsEditingTitle,
    setTempTitle,
    setModalConfig,
    setInteractionState,
    updateActiveRank,
    setActiveRankId,
    handleDeleteRank,
    handleNewRank,
    updateRankById,
    handleDuplicateConfirm,
    setDuplicateModalConfig,

    // Methods
    confirmAction,
    exportImage,
    copyImage,
  };
}
