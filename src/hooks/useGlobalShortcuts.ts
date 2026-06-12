import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { readFileAsDataURL } from "@/utils/imageUtils";

export function useGlobalShortcuts(setIsEditingTitle: (val: boolean) => void) {
  const [internalClipboard, setInternalClipboard] = useState<string | null>(null);

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

  // Keyboard Shortcuts
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
          const cols = rank.type === 'ranking' ? rank.config.cols : 1;
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
}
