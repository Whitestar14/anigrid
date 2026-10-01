import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/useStore";
import { useCommandState } from "@/state/commandState";
import { useToast } from "@/context/ToastContext";
import { readFileAsDataURL } from "@/utils/imageUtils";

/** Tile width steps for ⌘+ / ⌘−, and the range the rail's slider offers. */
const TILE_MIN = 80;
const TILE_MAX = 480;
const TILE_STEP = 40;

export interface ShortcutOptions {
  setIsEditingTitle: (val: boolean) => void;
  /** ⌘B. Optional so the hook can be used without the rail. */
  onToggleSidebar?: () => void;
  /** ⌘E. */
  onExport?: () => void;
}

export function useGlobalShortcuts(options: ShortcutOptions) {
  const [internalClipboard, setInternalClipboard] = useState<string | null>(null);
  const addToast = useToast();

  /* Options are read through a ref. They are new closures every render, and
     putting them in the effect's deps would tear down and re-attach the window
     listeners on every keystroke-driven render. */
  const optionsRef = useRef(options);
  optionsRef.current = options;

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
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      /* ── Palette and cheat sheet ──────────────────────────────────────────
         Handled before anything else so they work from any surface, and so the
         palette itself can be dismissed with the same key that opened it. */
      if (mod && key === "k") {
        e.preventDefault();
        useCommandState.getState().toggle();
        return;
      }
      if (mod && (e.key === "/" || e.key === "?")) {
        e.preventDefault();
        useCommandState.getState().toggleShortcuts();
        return;
      }
      if (mod && key === "b") {
        e.preventDefault();
        optionsRef.current.onToggleSidebar?.();
        return;
      }
      if (mod && key === "e") {
        e.preventDefault();
        optionsRef.current.onExport?.();
        return;
      }

      if (e.key === "Escape") {
        st.setInteractionState(null);
        optionsRef.current.setIsEditingTitle(false);
        return;
      }

      if (mod && key === "z") {
        e.preventDefault();
        const temporal = useStore.temporal.getState();
        if (e.shiftKey) {
          if (!temporal.futureStates.length) {
            addToast("info", "Nothing to redo");
            return;
          }
          temporal.redo();
          addToast("success", "Redone");
        } else {
          if (!temporal.pastStates.length) {
            addToast("info", "Nothing to undo");
            return;
          }
          temporal.undo();
          addToast("success", "Undone");
        }
        return;
      }

      /* ── Tile size ────────────────────────────────────────────────────────
         The rail's slider is the discoverable path; this is the fast one, and it
         makes the board comfortable to survey without leaving the keyboard. */
      if (mod && (e.key === "+" || e.key === "=" || e.key === "-")) {
        if (rank?.type === "ranking") {
          e.preventDefault();
          const current = rank.cellWidth ?? 240;
          const delta = e.key === "-" ? -TILE_STEP : TILE_STEP;
          const next = Math.min(TILE_MAX, Math.max(TILE_MIN, current + delta));
          if (next !== current) st.updateActiveRank({ cellWidth: next });
          return;
        }
      }

      // Arrow navigation for grid/list
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        if (st.interactionState?.type === "cell" && rank) {
          e.preventDefault();
          const maxCells = rank.cells.length;
          const cols = rank.type === "ranking" ? rank.config.cols : 1;
          let newIndex = st.interactionState.index;

          if (e.key === "ArrowRight") newIndex++;
          if (e.key === "ArrowLeft") newIndex--;
          if (e.key === "ArrowDown") newIndex += cols;
          if (e.key === "ArrowUp") newIndex -= cols;

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
      if (mod && key === "c") {
        if (st.interactionState?.type === "cell" && rank) {
          const cell = rank.cells[st.interactionState.index];
          if (cell && cell.imageSrc) {
            setInternalClipboard(cell.imageSrc);
          }
        }
      }
      if (mod && key === "v") {
        if (st.interactionState?.type === "cell" && rank && internalClipboard) {
          st.handleCellUpload(st.interactionState.index, internalClipboard);
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
            st.interactionState.itemId
          );
          st.setInteractionState(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [internalClipboard, addToast]);
}
