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
import {
  maybeCollapseDockOnDrag,
  scheduleDockExpand,
  writeInboxMultiDragData,
  writeSearchDragData,
} from "@/utils/inboxDrag";
import type { InboxItem, JikanResult } from "@/types";
import type { DockSurface, InboxTab } from "@/components/Inbox/types";

const OPEN_SEARCH_EVENT = "open-inbox-search";

export function useInboxController(
  requestConfirm: (title: string, message: string, action: () => void) => void
) {
  const addToast = useToast();
  const onInteract = useInboxItemInteraction();
  const autoCloseDockDesktop = useStore(
    (s) => s.preferences.autoCloseDockOnDragDesktop
  );
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
    handleMoveToInbox,
    handleTierItemRemove,
    handleAddToCollection,
    recallItemByImageSrc,
    handleUpdateLastTarget,
    handleRestoreItem,
    handleInboxUpload,
    setIsDraggingFromDock,
    isDraggingFromDock,
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
      handleMoveToInbox: s.handleMoveToInbox,
      handleTierItemRemove: s.handleTierItemRemove,
      handleAddToCollection: s.handleAddToCollection,
      recallItemByImageSrc: s.recallItemByImageSrc,
      handleUpdateLastTarget: s.handleUpdateLastTarget,
      setIsDraggingFromDock: s.setIsDraggingFromDock,
      isDraggingFromDock: s.inbox.isDraggingFromDock,
      handleRestoreItem: s.handleRestoreItem,
      handleInboxUpload: s.handleInboxUpload,
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
  const [searchResults, setSearchResults] = useState<JikanResult[]>([]);

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

  const handleDragStart = useCallback(
    (e: React.DragEvent, id: string) => {
      const idsToDrag = selectedItemIds.has(id)
        ? Array.from(selectedItemIds)
        : [id];
      writeInboxMultiDragData(
        e,
        idsToDrag,
        isAllView ? "all" : activeCollectionId
      );
      // Flag that drag originated from dock so it can auto-reopen after drop
      setIsDraggingFromDock(true);
    },
    [selectedItemIds, isAllView, activeCollectionId]
  );

  const handleItemClick = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      if (e.shiftKey) {
        setSelectedItemIds((prev) => {
          const next = new Set(prev);
          if (next.has(itemId)) next.delete(itemId);
          else next.add(itemId);
          return next;
        });
      } else {
        setSelectedItemIds(new Set([itemId]));
        onInteract(itemId, isAllView ? "all-images" : activeCollectionId);
      }
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

  const handleSearchDragStart = useCallback(
    (e: React.DragEvent, imageSrc: string) => {
      writeSearchDragData(e, imageSrc);
      // Flag that drag originated from dock so it can auto-reopen after drop
      setIsDraggingFromDock(true);
    },
    []
  );

  const handleSmartAdd = useCallback(
    (imageSrc: string) => {
      if (
        lastTargetCollectionId &&
        collections.some((c) => c.id === lastTargetCollectionId)
      ) {
        const targetName =
          collections.find((c) => c.id === lastTargetCollectionId)?.name ||
          "Collection";
        handleAddToCollection(imageSrc, lastTargetCollectionId);
        addToast("success", `Added to ${targetName}`, "Change", () => {
          setPendingPickerImage(imageSrc);
          setActiveTab("picker");
        });
      } else {
        setPendingPickerImage(imageSrc);
        setActiveTab("picker");
      }
    },
    [lastTargetCollectionId, collections, handleAddToCollection, addToast]
  );

  const handleRecall = useCallback(
    (imageSrc: string) => {
      recallItemByImageSrc(imageSrc);
      addToast("info", "Image recalled from board");
    },
    [recallItemByImageSrc, addToast]
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (activeTab === "stash" && !isAllView) {
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const files = e.dataTransfer.files;
          void (async () => {
            for (let i = 0; i < files.length; i++) {
              try {
                const src = await readFileAsDataURL(files[i]);
                handleInboxUpload(src);
              } catch (err) {
                console.error("Failed to parse file", err);
              }
            }
          })();
          if (!isExpanded) setIsExpanded(true);
          return;
        }
      }

      const dragData = e.dataTransfer.getData("application/json");
      if (dragData) {
        try {
          const source = JSON.parse(dragData) as { type?: string };
          if (source.type === "cell") {
            handleMoveToInbox((source as { index: number }).index);
            scheduleDockExpand(setIsExpanded);
          } else if (source.type === "tier-item") {
            const t = source as { rowId: string; itemId: string };
            handleTierItemRemove(t.rowId, t.itemId);
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
      handleInboxUpload,
      handleMoveToInbox,
      handleTierItemRemove,
    ]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
      if (!isExpanded) setIsExpanded(true);
    },
    [isExpanded]
  );

  const toggleExpand = useCallback(() => setIsExpanded((v) => !v), []);

  const expandDockAfterDrag = useCallback(() => {
    scheduleDockExpand(setIsExpanded);
  }, []);

  const handleCollectionPick = useCallback(
    (colId: string) => {
      if (!pendingPickerImage) return;
      handleAddToCollection(pendingPickerImage, colId);
      handleUpdateLastTarget(colId);
      setPendingPickerImage(null);
      setActiveTab("search");
      const colName = collections.find((c) => c.id === colId)?.name;
      addToast("success", `Added to ${colName}`);
    },
    [
      pendingPickerImage,
      handleAddToCollection,
      handleUpdateLastTarget,
      collections,
      addToast,
    ]
  );

  const requestDeleteCollection = useCallback(
    (col: { id: string; name: string }) => {
      requestConfirm(`Delete "${col.name}"?`, "All items lost.", () =>
        deleteCollection(col.id)
      );
    },
    [requestConfirm, deleteCollection]
  );

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      void (async () => {
        const files = e.target.files;
        if (!files) return;
        for (let i = 0; i < files.length; i++) {
          try {
            const src = await readFileAsDataURL(files[i]);
            handleInboxUpload(src);
          } catch (err) {
            console.error("Failed to parse file", err);
          }
        }
      })();
    },
    [handleInboxUpload]
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
    searchResults,
    setSearchResults,
    editingNameId,
    setEditingNameId,
    tempName,
    setTempName,
    selectedItemIds,
    setSelectedItemIds,
    isDragOver,
    setIsDragOver,
    handleDragStart,
    handleItemClick,
    handleBulkDelete,
    handleSearchDragStart,
    handleSmartAdd,
    handleDeleteItem,
    handleRecall,
    handleDrop,
    handleDragOver,
    toggleExpand,
    handleCollectionPick,
    requestDeleteCollection,
    onFileInputChange,
    expandDockAfterDrag,
    setIsDraggingFromDock,
    isDraggingFromDock,
  };
}
