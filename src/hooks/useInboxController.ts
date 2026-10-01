import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useStore } from "@/store/useStore";
import { useShallow } from "zustand/react/shallow";
import { useToast } from "@/context/ToastContext";
import { useImagePresenceSets } from "@/hooks/useImagePresenceSets";
import { useInboxItemInteraction } from "@/hooks/useInboxItemInteraction";
import { readFileAsDataURL } from "@/utils/imageUtils";
import { scheduleDockExpand, DOCK_EXPAND_EVENT } from "@/utils/inboxDrag";
import type { ImageSourcePreference, InboxItem } from "@/types";
import type { DockSurface, InboxTab } from "@/components/Inbox/types";
import { runActivity, useActivityState } from "@/state/activityState";

const OPEN_SEARCH_EVENT = "open-inbox-search";

export function useInboxController(
  requestConfirm: (title: string, message: string, action: () => void) => void
) {
  const addToast = useToast();
  const onInteract = useInboxItemInteraction();
  const { inboxImageSet: usedImageSrcs, boardImageSet: usedOnBoard } =
    useImagePresenceSets();

  const {
    collections,
    activeCollectionId,
    lastTargetCollectionId,
    interactionState,
    switchCollection,
    addCollection,
    deleteCollection,
    renameCollection,
    removeInboxItem,
    moveItemsToCollection,
    handleItemTransfer,
    handleAddToCollection,
    handleRecallFromBoard,
    handleUpdateLastTarget,
    handleRestoreItem,
    handleInboxUpload,
    setIsDraggingFromDock,
    isDraggingFromDock,
    searchSource,
    updatePreferences,
  } = useStore(
    useShallow((s) => ({
      collections: s.inbox.collections,
      activeCollectionId: s.inbox.activeCollectionId,
      lastTargetCollectionId: s.inbox.lastTargetCollectionId,
      interactionState: s.interactionState,
      switchCollection: s.switchCollection,
      addCollection: s.addCollection,
      deleteCollection: s.deleteCollection,
      renameCollection: s.renameCollection,
      removeInboxItem: s.removeInboxItem,
      moveItemsToCollection: s.moveItemsToCollection,
      handleItemTransfer: s.handleItemTransfer,
      handleAddToCollection: s.handleAddToCollection,
      handleRecallFromBoard: s.handleRecallFromBoard,
      handleUpdateLastTarget: s.handleUpdateLastTarget,
      setIsDraggingFromDock: s.setIsDraggingFromDock,
      isDraggingFromDock: s.inbox.isDraggingFromDock,
      handleRestoreItem: s.handleRestoreItem,
      handleInboxUpload: s.handleInboxUpload,
      searchSource: (s.preferences.imageSource ??
        "auto") as ImageSourcePreference,
      updatePreferences: s.updatePreferences,
    }))
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<InboxTab>("stash");
  const [dockSurface, setDockSurface] = useState<DockSurface>("library");
  const [isExpanded, setIsExpanded] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"anime" | "characters">(
    "characters"
  );

  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set()
  );
  const [pendingPickerImage, setPendingPickerImage] = useState<string | null>(
    null
  );

  const allItems = useMemo(
    () => collections.flatMap((c) => c.items),
    [collections]
  );

  const activeCollection = collections.find((c) => c.id === activeCollectionId);
  const currentItems =
    activeCollectionId === "all-images"
      ? allItems
      : activeCollection?.items || [];
  const isAllView = activeCollectionId === "all-images";

  useEffect(() => {
    setSelectedItemIds(new Set());
  }, [activeCollectionId]);

  useEffect(() => {
    const handleOpenSearch = () => {
      setDockSurface("library");
      setIsExpanded(true);
      setActiveTab("search");
    };
    window.addEventListener(OPEN_SEARCH_EVENT, handleOpenSearch);
    return () =>
      window.removeEventListener(OPEN_SEARCH_EVENT, handleOpenSearch);
  }, []);

  useEffect(() => {
    const handleExpand = () => setIsExpanded(true);
    window.addEventListener(DOCK_EXPAND_EVENT, handleExpand);
    return () => window.removeEventListener(DOCK_EXPAND_EVENT, handleExpand);
  }, []);



  const handleItemClick = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      // Toggle selection for bulk actions
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        if (next.has(itemId)) next.delete(itemId);
        else next.add(itemId);
        return next;
      });
      // Fire interaction event for tap-to-drop functionality
      onInteract(itemId, isAllView ? "all-images" : activeCollectionId);
    },
    [onInteract, isAllView, activeCollectionId]
  );

  const handleBulkDelete = useCallback(() => {
    if (selectedItemIds.size === 0) return;
    const n = selectedItemIds.size;
    requestConfirm(
      `Delete ${n} item${n > 1 ? "s" : ""}?`,
      "This action cannot be undone.",
      () => {
        selectedItemIds.forEach((id) => removeInboxItem(id));
        setSelectedItemIds(new Set());
        addToast("info", `Removed ${n} items`);
      }
    );
  }, [selectedItemIds, removeInboxItem, addToast, requestConfirm]);



  const toastAddedToCollection = useCallback(
    (imageSrc: string, colId: string) => {
      const colName =
        collections.find((c) => c.id === colId)?.name || "Collection";
      addToast("success", `Added to ${colName}`, "Change", () => {
        setPendingPickerImage(imageSrc);
        setActiveTab("picker");
      });
    },
    [collections, addToast]
  );

  const handleSmartAdd = useCallback(
    (imageSrc: string) => {
      if (
        lastTargetCollectionId &&
        collections.some((c) => c.id === lastTargetCollectionId)
      ) {
        handleAddToCollection(imageSrc, lastTargetCollectionId);
        toastAddedToCollection(imageSrc, lastTargetCollectionId);
      } else {
        setPendingPickerImage(imageSrc);
        setActiveTab("picker");
      }
    },
    [lastTargetCollectionId, collections, handleAddToCollection, toastAddedToCollection]
  );

  /** Takes the poster off the board and leaves it in the library. */
  const handleRecall = useCallback(
    (imageSrc: string) => {
      handleRecallFromBoard(imageSrc);
      addToast("info", "Returned to stash");
    },
    [handleRecallFromBoard, addToast]
  );

  const handleDeleteItem = useCallback(
    (item: InboxItem) => {
      removeInboxItem(item.id);
      let originCollectionId = activeCollectionId;
      if (isAllView) {
        const foundCol = collections.find((c) =>
          c.items.some((i) => i.id === item.id)
        );
        if (foundCol) originCollectionId = foundCol.id;
      }
      addToast("info", "Image removed from stash", "Undo", () => {
        handleRestoreItem(item, originCollectionId);
      });
    },
    [
      removeInboxItem,
      activeCollectionId,
      isAllView,
      collections,
      addToast,
      handleRestoreItem,
    ]
  );

  const ingestFiles = useCallback(
    (files: FileList) => {
      const list = Array.from(files);
      if (list.length === 0) return;

      if (list.length === 1 && list[0].size < 512_000) {
        void (async () => {
          try {
            handleInboxUpload(await readFileAsDataURL(list[0]));
          } catch (err) {
            console.error("Failed to parse file", err);
          }
        })();
        return;
      }

      void runActivity(
        list.length === 1
          ? "Processing image"
          : `Importing ${list.length} images`,
        async () => {
          let failed = 0;
          for (let i = 0; i < list.length; i++) {
            try {
              handleInboxUpload(await readFileAsDataURL(list[i]));
            } catch (err) {
              failed++;
              console.error("Failed to parse file", err);
            }
            useActivityState.getState().setProgress((i + 1) / list.length);
          }
          if (failed === list.length) throw new Error("No images could be read");
        },
        {
          successLabel: `${list.length} ${
            list.length === 1 ? "image" : "images"
          } added`,
          errorLabel: "Import failed",
        }
      );
    },
    [handleInboxUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (activeTab === "stash" && !isAllView) {
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          ingestFiles(e.dataTransfer.files);
          if (!isExpanded) setIsExpanded(true);
          return;
        }
      }

      const dragData = e.dataTransfer.getData("application/json");
      if (dragData) {
        try {
          const source = JSON.parse(dragData) as { type?: string };
          if (source.type === "cell") {
            handleItemTransfer({ type: "cell", index: (source as { index: number }).index }, { type: "inbox" });
            scheduleDockExpand(setIsExpanded);
          } else if (source.type === "tier-item") {
            const t = source as { rowId: string; itemId: string };
            handleItemTransfer({ type: "tier", rowId: t.rowId, itemId: t.itemId }, { type: "inbox" });
            scheduleDockExpand(setIsExpanded);
          }
        } catch {
          /* ignore */
        }
      }
    },
    [
      activeTab,
      isAllView,
      isExpanded,
      ingestFiles,
      handleItemTransfer,
    ]
  );

  /**
   * An external drag is one the app did not start — a file from the desktop or
   * an image from another window. dnd-kit drags use pointer events, so they
   * never reach the native drag handlers; anything that does is external.
   */
  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
      // Open the dock so a collapsed bar is not a 48px target you have to hit.
      if (!isExpanded) setIsExpanded(true);
    },
    [isExpanded]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
      if (!isExpanded) setIsExpanded(true);
    },
    [isExpanded]
  );

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const toggleExpand = useCallback(() => setIsExpanded((v) => !v), []);

  const handleCollectionPick = useCallback(
    (colId: string) => {
      if (!pendingPickerImage) return;
      const imageSrc = pendingPickerImage;
      handleAddToCollection(imageSrc, colId);
      handleUpdateLastTarget(colId);
      setPendingPickerImage(null);
      setActiveTab("search");
      toastAddedToCollection(imageSrc, colId);
    },
    [
      pendingPickerImage,
      handleAddToCollection,
      handleUpdateLastTarget,
      toastAddedToCollection,
    ]
  );

  const requestDeleteCollection = useCallback(
    (col: { id: string; name: string; items: InboxItem[] }) => {
      const itemCount = col.items ? col.items.length : 0;
      if (itemCount === 0) {
        deleteCollection(col.id);
        return;
      }
      requestConfirm(
        `Delete "${col.name}"?`, 
        `This will permanently delete the collection and its ${itemCount} item${itemCount === 1 ? '' : 's'}. This action cannot be undone.`, 
        () => deleteCollection(col.id)
      );
    },
    [requestConfirm, deleteCollection]
  );

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) ingestFiles(e.target.files);
      // Let the same file be chosen twice in a row.
      e.target.value = "";
    },
    [ingestFiles]
  );

  return {
    fileInputRef: fileInputRef as RefObject<HTMLInputElement | null>,
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
    searchSource,
    setSearchSource: (source: ImageSourcePreference) =>
      updatePreferences({ imageSource: source }),
    editingNameId,
    setEditingNameId,
    tempName,
    setTempName,
    selectedItemIds,
    setSelectedItemIds,
    isDragOver,
    setIsDragOver,
    handleItemClick,
    handleBulkDelete,
    handleSmartAdd,
    handleDeleteItem,
    handleRecall,
    handleDrop,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    toggleExpand,
    handleCollectionPick,
    requestDeleteCollection,
    moveItemsToCollection: moveItemsToCollection,
    onFileInputChange,
    setIsDraggingFromDock,
    isDraggingFromDock,
  };
}
