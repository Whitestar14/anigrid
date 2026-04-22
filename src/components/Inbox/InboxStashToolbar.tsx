import React from "react";
import type { InboxCollection } from "@/types";
import { Trash, X } from "lucide-react";
import { InboxCollectionTabsRow } from "./InboxCollectionTabsRow";

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
}

export const InboxStashToolbar: React.FC<InboxStashToolbarProps> = ({
  selectedItemIds,
  onBulkDelete,
  onClearSelection,
  ...tabs
}) => (
  <div className="flex items-center gap-2 px-6 py-3 border-b border-white/10 shrink-0 overflow-x-auto hide-scrollbar bg-[#1c1c1e]/50">
    {selectedItemIds.size > 0 ? (
      <div className="flex items-center gap-3 w-full animate-in fade-in">
        <span className="text-[13px] font-medium text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-lg">
          {selectedItemIds.size} Selected
        </span>
        <button
          type="button"
          onClick={onBulkDelete}
          className="flex items-center gap-1.5 text-[13px] font-medium text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Trash size={14} />
          Delete
        </button>
        <button
          type="button"
          onClick={onClearSelection}
          className="flex items-center gap-1.5 text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors ml-auto"
        >
          <X size={14} />
          Cancel
        </button>
      </div>
    ) : (
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
    )}
  </div>
);
