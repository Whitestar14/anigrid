import React from "react";
import type { InboxCollection } from "@/types";
import { Trash, X, FolderInput } from "lucide-react";
import { InboxCollectionTabsRow } from "./InboxCollectionTabsRow";
import { motion, AnimatePresence } from "motion/react";

export interface InboxStashToolbarProps {
  selectedItemIds: Set<string>;
  collections: InboxCollection[];
  activeCollectionId: string;
  editingNameId: string | null;
  tempName: string;
  onSwitchCollection: (id: string) => void;
  onAddCollection: () => void;
  onStartRename: (id: string, name: string) => void;
  onTempNameChange: (v: string) => void;
  onCommitRename: (colId: string) => void;
  onRequestDeleteCollection: (col: InboxCollection) => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onMoveItemsToCollection?: (colId: string) => void;
}

export const InboxStashToolbar: React.FC<InboxStashToolbarProps> = ({
  selectedItemIds,
  onBulkDelete,
  onClearSelection,
  onMoveItemsToCollection,
  ...tabs
}) => (
  <div className="flex items-center gap-2 px-6 py-3 border-b border-border shrink-0 hide-scrollbar bg-surface/50 relative h-14 z-10 overflow-visible">
    <AnimatePresence mode="popLayout" initial={false}>
      {selectedItemIds.size > 0 ? (
        <motion.div
          key="selection-toolbar"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-3 w-full py-1"
        >
          <span className="text-[13px] font-medium text-primary bg-primary/10 px-4 py-1.5 rounded-full">
            {selectedItemIds.size} Selected
          </span>
          <div className="relative flex items-center justify-center">
            <select 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              value=""
              onChange={(e) => {
                const val = e.target.value;
                if (val && onMoveItemsToCollection) {
                  onMoveItemsToCollection(val);
                }
              }}
            >
              <option value="" disabled>Move to...</option>
              {tabs.collections.filter(c => c.id !== tabs.activeCollectionId).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-text hover:bg-hover px-4 py-1.5 rounded-full transition-colors pointer-events-none border border-border">
              <FolderInput size={14} className="text-muted" />
              Move To
            </div>
          </div>
          <button
            type="button"
            onClick={onBulkDelete}
            className="flex items-center gap-1.5 text-[13px] font-medium text-red-500 hover:bg-red-500/10 px-4 py-1.5 rounded-full transition-colors ml-auto"
          >
            <Trash size={14} />
            <span className="hidden sm:inline">Delete</span>
          </button>
          <button
            type="button"
            onClick={onClearSelection}
            className="flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-text hover:bg-hover px-4 py-1.5 rounded-full transition-colors"
          >
            <X size={14} />
            <span className="hidden sm:inline">Cancel</span>
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="tabs-toolbar"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full flex items-center gap-2 overflow-x-auto hide-scrollbar py-1"
        >
          <InboxCollectionTabsRow
            collections={tabs.collections}
            activeCollectionId={tabs.activeCollectionId}
            editingNameId={tabs.editingNameId}
            tempName={tabs.tempName}
            onSwitchCollection={tabs.onSwitchCollection}
            onAddCollection={tabs.onAddCollection}
            onStartRename={tabs.onStartRename}
            onTempNameChange={tabs.onTempNameChange}
            onCommitRename={tabs.onCommitRename}
            onRequestDeleteCollection={tabs.onRequestDeleteCollection}
          />
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
