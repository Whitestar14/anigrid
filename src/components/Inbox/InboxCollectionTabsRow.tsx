import React from "react";
import { motion } from "motion/react";
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

const chipClass = (active: boolean) =>
  `flex items-center gap-1.5 h-8 px-3.5 rounded-full shrink-0 text-footnote font-medium
   transition-colors duration-150 select-none
   ${
     active
       ? "bg-primary/15 text-primary"
       : "text-muted hover:text-text hover:bg-hover"
   }`;

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
}) => {
  const isAllActive = activeCollectionId === "all-images";

  return (
    <>
      <button
        type="button"
        onClick={() => onSwitchCollection("all-images")}
        aria-pressed={isAllActive}
        className={chipClass(isAllActive)}
      >
        <Layers size={14} />
        All
      </button>

      <div aria-hidden className="w-px h-4 bg-border mx-1 shrink-0" />

      {collections.map((col) => {
        const isActive = col.id === activeCollectionId;
        const isEditing = editingNameId === col.id;

        return (
          <div
            key={col.id}
            role="button"
            tabIndex={0}
            aria-pressed={isActive}
            onClick={() => !isEditing && onSwitchCollection(col.id)}
            onKeyDown={(e) => {
              if (!isEditing && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onSwitchCollection(col.id);
              }
            }}
            className={`${chipClass(isActive)} pr-2`}
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
                  if (e.key === "Escape") e.currentTarget.blur();
                }}
                aria-label="Collection name"
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent border-none outline-none text-text w-[7ch] min-w-16 font-medium"
              />
            ) : (
              <>
                <span className="truncate max-w-[120px]">{col.name}</span>

                {/* Rename and delete only exist on the selected chip, so the
                    row stays a plain list of names until you pick one. */}
                {isActive && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartRename(col.id, col.name);
                      }}
                      className="text-current/70 hover:text-current p-0.5 transition-colors shrink-0"
                      title="Rename"
                    >
                      <Edit size={12} />
                    </button>
                    {collections.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestDeleteCollection(col);
                        }}
                        className="text-current/70 hover:text-destructive p-0.5 transition-colors shrink-0"
                        title="Delete collection"
                      >
                        <Trash size={12} />
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        );
      })}

      <motion.button
        type="button"
        whileTap={{ scale: 0.9, rotate: 90 }}
        onClick={onAddCollection}
        className="grid place-items-center w-8 h-8 rounded-full shrink-0 text-muted
                   hover:text-primary hover:bg-hover transition-colors"
        title="New collection"
        aria-label="New collection"
      >
        <Plus size={16} />
      </motion.button>
    </>
  );
});

InboxCollectionTabsRow.displayName = "InboxCollectionTabsRow";
