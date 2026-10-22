import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Edit, Layers, Plus, Trash, X, FolderInput } from "lucide-react";
import { useStore } from "@/store/useStore";
import { MagnifyItem } from "./MagnifyItem";
import { useMagnificationRow } from "@/hooks/useMagnification";
import { motion as motionPreset } from "@/lib/motion";
import type { DockCtrl } from "./dock/types";

const chipClass = (active: boolean) =>
  `flex items-center gap-1.5 h-8 px-3.5 rounded-full shrink-0 text-footnote font-medium
   transition-colors duration-150 select-none
   ${active ? "bg-primary/15 text-primary" : "text-muted hover:text-text hover:bg-hover"}`;

/**
 * The stash surface's toolbar, in its two mutually exclusive states: the
 * collection chips, or the bulk-action bar once something is selected.
 *
 * These used to be separate components — a toolbar that chose between a tabs
 * row and a selection bar — and the tabs row then forwarded ten of the
 * toolbar's props back down unchanged. One component, two states.
 */
export const InboxStashToolbar: React.FC<{ ctrl: DockCtrl }> = ({ ctrl }) => {
  const mag = useMagnificationRow();
  const canHover = useCanHover();
  const selected = ctrl.selectedItemIds;

  /** Clearing a selection has to clear the tap-to-place target with it. */
  const clearSelection = () => {
    ctrl.setSelectedItemIds(new Set());
    useStore.getState().setInteractionState(null);
  };

  const moveSelected = (targetId: string) => {
    ctrl.moveItemsToCollection(Array.from(selected), targetId);
    clearSelection();
  };

  return (
    <div className="flex items-center gap-2 px-2 sm:px-6 py-3 border-b border-border shrink-0 hide-scrollbar material-thin relative h-14 z-10 overflow-visible">
      <AnimatePresence mode="popLayout" initial={false}>
        {selected.size > 0 ? (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1 justify-between sm:gap-3 w-full py-1"
          >
            <div className="flex gap-1">
              <span className="text-footnote font-medium text-primary bg-primary/10 px-3 sm:px-4 py-1.5 rounded-full">
                {selected.size} Selected
              </span>

              {/* A native select, transparent and stretched over a matching
                  styled label. The menu itself is the platform's, which is what
                  makes it feel native rather than like another custom popover. */}
              <div className="relative flex items-center justify-center">
                <select
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) moveSelected(e.target.value);
                  }}
                >
                  <option value="" disabled>
                    Move to...
                  </option>
                  {ctrl.collections
                    .filter((c) => c.id !== ctrl.activeCollectionId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
                <div className="flex items-center gap-1.5 text-footnote font-medium text-text hover:bg-hover px-3 sm:px-4 py-1.5 rounded-full transition-colors pointer-events-none border border-border">
                  <FolderInput size={14} className="text-muted" />
                  Move To
                </div>
              </div>
            </div>

            <div className="flex gap-1">
              <button
                type="button"
                onClick={ctrl.handleBulkDelete}
                className="flex items-center gap-1.5 text-footnote font-medium text-red-500 hover:bg-red-500/10 px-3 sm:px-4 py-1.5 rounded-full transition-colors ml-auto"
              >
                <Trash size={14} />
                <span className="hidden sm:inline">Delete</span>
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="flex items-center gap-1.5 text-footnote font-medium text-muted hover:text-text hover:bg-hover px-3 sm:px-4 py-1.5 rounded-full transition-colors"
              >
                <X size={14} />
                <span className="hidden sm:inline">Cancel</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chips"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <div
              ref={mag.rowRef}
              className="flex items-center gap-2 w-full"
              {...(canHover ? mag.handlers : {})}
            >
              <MagnifyItem index={0} ctx={mag}>
                <button
                  type="button"
                  onClick={() => ctrl.switchCollection("all-images")}
                  aria-pressed={ctrl.activeCollectionId === "all-images"}
                  className={chipClass(ctrl.activeCollectionId === "all-images")}
                >
                  <Layers size={14} />
                  All
                </button>
              </MagnifyItem>

              <div aria-hidden className="w-px h-4 bg-border mx-1 shrink-0" />

              {ctrl.collections.map((col, i) => (
                <CollectionChip
                  key={col.id}
                  index={i + 1}
                  mag={mag}
                  name={col.name}
                  isActive={col.id === ctrl.activeCollectionId}
                  isEditing={ctrl.editingNameId === col.id}
                  tempName={ctrl.tempName}
                  canDelete={ctrl.collections.length > 1}
                  onSelect={() => ctrl.switchCollection(col.id)}
                  onStartRename={() => {
                    ctrl.setEditingNameId(col.id);
                    ctrl.setTempName(col.name);
                  }}
                  onTempNameChange={ctrl.setTempName}
                  onCommitRename={() => commitRename(ctrl, col.id)}
                  onCancelRename={() => ctrl.setEditingNameId(null)}
                  onDelete={() => ctrl.requestDeleteCollection(col)}
                />
              ))}

              <motion.button
                type="button"
                whileTap={{ scale: 0.9, rotate: 90 }}
                transition={motionPreset.snappy}
                onClick={ctrl.addCollection}
                className="grid place-items-center w-8 h-8 rounded-full shrink-0 text-muted
                           hover:text-primary hover:bg-hover transition-colors"
                title="New collection"
                aria-label="New collection"
              >
                <Plus size={16} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/** A blank name cancels the rename rather than creating an unnamed chip. */
function commitRename(ctrl: DockCtrl, colId: string) {
  if (ctrl.tempName.trim()) ctrl.renameCollection(colId, ctrl.tempName);
  ctrl.setEditingNameId(null);
}

/** Rename and delete exist only on the selected chip, so the row stays a plain
 *  list of names until one is picked. */
const CollectionChip: React.FC<{
  index: number;
  mag: ReturnType<typeof useMagnificationRow>;
  name: string;
  isActive: boolean;
  isEditing: boolean;
  tempName: string;
  canDelete: boolean;
  onSelect: () => void;
  onStartRename: () => void;
  onTempNameChange: (v: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onDelete: () => void;
}> = (props) => (
  <MagnifyItem index={props.index} ctx={props.mag}>
    <div
      role="button"
      tabIndex={0}
      aria-pressed={props.isActive}
      onClick={() => !props.isEditing && props.onSelect()}
      onKeyDown={(e) => {
        if (!props.isEditing && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          props.onSelect();
        }
      }}
      className={`${chipClass(props.isActive)} pr-2`}
    >
      {props.isEditing ? (
        <input
          autoFocus
          type="text"
          value={props.tempName}
          onFocus={(e) => e.target.select()}
          onChange={(e) => props.onTempNameChange(e.target.value)}
          onBlur={props.onCommitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              if (e.key === "Escape") props.onCancelRename();
              e.currentTarget.blur();
            }
          }}
          aria-label="Collection name"
          onClick={(e) => e.stopPropagation()}
          className="bg-transparent border-none outline-none text-text w-[7ch] min-w-16 font-medium"
        />
      ) : (
        <>
          <span className="truncate max-w-[120px]">{props.name}</span>
          {props.isActive && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onStartRename();
                }}
                className="text-current/70 hover:text-current p-0.5 transition-colors shrink-0"
                title="Rename"
                aria-label="Rename"
              >
                <Edit size={12} />
              </button>
              {props.canDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onDelete();
                  }}
                  className="text-current/70 hover:text-destructive p-0.5 transition-colors shrink-0"
                  title="Delete collection"
                  aria-label="Delete collection"
                >
                  <Trash size={12} />
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  </MagnifyItem>
);

/** True only on devices that actually have a hovering pointer. */
function useCanHover() {
  const [canHover, setCanHover] = React.useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );

  React.useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const onChange = () => setCanHover(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return canHover;
}