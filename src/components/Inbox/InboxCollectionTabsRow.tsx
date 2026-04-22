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

export const InboxCollectionTabsRow: React.FC<InboxCollectionTabsRowProps> = ({
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
                                      flex items-center gap-2 px-4 py-1.5 cursor-pointer text-[13px] font-medium rounded-lg transition-all shrink-0
                                      ${activeCollectionId === "all-images" ? "bg-[#636366] text-white shadow-sm" : "text-white/70 hover:text-white hover:bg-white/10"}
                                    `}
    >
      <Layers size={14} />
      All
    </div>

    <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />

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
                                        group relative flex items-center gap-2 px-4 py-1.5 cursor-pointer text-[13px] font-medium rounded-lg transition-all min-w-[100px] justify-between shrink-0
                                        ${
                                          isActive
                                            ? "bg-[#636366] text-white shadow-sm"
                                            : "text-white/70 hover:text-white hover:bg-white/10"
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
              className="bg-transparent border-none outline-none text-white w-full font-medium"
            />
          ) : (
            <div className="flex items-center gap-2 max-w-[120px]">
              <span className="truncate">{col.name}</span>
              {isActive && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartRename(col.id, col.name);
                  }}
                  className="text-white/50 hover:text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
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
              className="p-0.5 hover:text-red-400 text-white/50 transition-colors ml-auto opacity-0 group-hover:opacity-100"
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
      className="px-3 py-1.5 text-white/70 hover:text-blue-400 transition-colors hover:bg-white/10 rounded-lg"
      title="Create New Collection"
    >
      <Plus size={16} />
    </motion.button>
  </>
);
