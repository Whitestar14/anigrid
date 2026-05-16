import React from "react";
import { motion } from "framer-motion";
import { Edit, Layers, Plus, Trash } from "lucide-react";
import type { InboxCollection } from "@/types";

export interface InboxCollectionTabsRowProps {
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
}

export const InboxCollectionTabsRow = React.memo<InboxCollectionTabsRowProps>(({
  collections,
  activeCollectionId,
  editingNameId,
  tempName,
  onSwitchCollection,
  onAddCollection,
  onStartRename,
  onTempNameChange,
  onCommitRename,
  onRequestDeleteCollection,
}) => (
  <>
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSwitchCollection("all-images")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSwitchCollection("all-images");
        }
      }}
      className={`
                                      flex items-center gap-2 px-4 py-1.5 cursor-pointer text-[13px] font-medium rounded-full shrink-0
                                      ${activeCollectionId === "all-images" ? "bg-surface-elevated text-text shadow-sm" : "text-muted hover:text-text hover:bg-hover"}
                                    `}
    >
      <Layers size={14} />
      All
    </div>

    <div className="w-px h-4 bg-border mx-1 shrink-0" />

    {collections.map((col) => {
      const isActive = col.id === activeCollectionId;
      const isEditing = editingNameId === col.id;

      return (
        <div
          key={col.id}
          role="button"
          tabIndex={0}
          onClick={() => !isEditing && onSwitchCollection(col.id)}
          onKeyDown={(e) => {
            if (!isEditing && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onSwitchCollection(col.id);
            }
          }}
          className={`
                                        group relative flex items-center gap-2 px-4 py-1.5 cursor-pointer text-[13px] font-medium rounded-full min-w-[100px] justify-between shrink-0
                                        ${isActive
              ? "bg-surface-elevated text-text shadow-sm"
              : "text-muted hover:text-text hover:bg-hover"
            }
                                      `}
        >
          {isEditing ? (
            <input
              autoFocus
              type="text"
              value={tempName}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onTempNameChange(e.target.value)}
              onBlur={() => onCommitRename(col.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="bg-transparent border-none outline-none text-text w-full font-medium"
            />
          ) : (
            <div className="flex items-center gap-2 max-w-[120px] min-w-0">
              <span className="truncate min-w-0">{col.name}</span>
              {isActive && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartRename(col.id, col.name);
                  }}
                  className="text-muted hover:text-text p-0.5 transition-colors shrink-0"
                  title="Rename"
                >
                  <Edit size={12} />
                </button>
              )}
            </div>
          )}

          {!isEditing && isActive && collections.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRequestDeleteCollection(col);
              }}
              className="p-0.5 hover:text-red-400 text-muted transition-colors ml-auto"
              title="Delete Collection"
            >
              <Trash size={12} />
            </button>
          )}
        </div>
      );
    })}

    <motion.button
      type="button"
      whileTap={{ scale: 0.9, rotate: 90 }}
      onClick={onAddCollection}
      className="px-3 py-1.5 text-muted hover:text-blue-400 transition-colors hover:bg-hover rounded-full"
      title="Create New Collection"
    >
      <Plus size={16} />
    </motion.button>
  </>
));
