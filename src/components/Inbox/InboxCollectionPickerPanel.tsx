import React from "react";
import { ArrowLeft, Edit2, FolderPlus, Package } from "lucide-react";
import type { InboxCollection } from "@/types";

export interface InboxCollectionPickerPanelProps {
  collections: InboxCollection[];
  lastTargetCollectionId?: string;
  editingNameId: string | null;
  tempName: string;
  onBack: () => void;
  onPickCollection: (colId: string) => void;
  onAddCollection: () => void;
  onStartRename: (id: string, name: string) => void;
  onTempNameChange: (v: string) => void;
  onCommitRename: (colId: string) => void;
  onCancelRename: () => void;
}

export const InboxCollectionPickerPanel: React.FC<
  InboxCollectionPickerPanelProps
> = ({
  collections,
  lastTargetCollectionId,
  editingNameId,
  tempName,
  onBack,
  onPickCollection,
  onAddCollection,
  onStartRename,
  onTempNameChange,
  onCommitRename,
  onCancelRename,
}) => {
    return (
      <div className="absolute inset-0 bg-surface flex flex-col p-6 animate-in fade-in slide-in-from-right-4 z-20">
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-hover rounded-full text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h3 className="text-[15px] font-semibold text-text">Select Collection</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar">
          {collections.map((col) => {
            const isEditing = editingNameId === col.id;
            return (
              <div
                key={col.id}
                role="button"
                tabIndex={0}
                onClick={() => !isEditing && onPickCollection(col.id)}
                onKeyDown={(e) => {
                  if (!isEditing && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onPickCollection(col.id);
                  }
                }}
                className={`
                                      group relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-3 text-center h-32
                                      ${col.id === lastTargetCollectionId
                    ? "bg-primary/10 border-primary/50 text-primary"
                    : "bg-surface-secondary border-transparent hover:border-border hover:bg-surface text-muted hover:text-text cursor-pointer"
                  }
                                  `}
              >
                <Package size={28} strokeWidth={1.5} />
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
                      if (e.key === "Escape") onCancelRename();
                    }}
                    className="w-full bg-surface border border-border rounded px-2 py-0.5 text-[13px] text-text outline-none focus:border-primary text-center"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <span className="font-medium text-[13px] line-clamp-2">
                      {col.name}
                    </span>
                    {col.id === lastTargetCollectionId && (
                      <span className="text-[11px] font-medium text-primary/75 absolute bottom-2">
                        Recent
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartRename(col.id, col.name);
                      }}
                      className="absolute top-2 right-2 p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-hover rounded-full text-muted hover:text-text transition-all"
                    >
                      <Edit2 size={12} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={onAddCollection}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed border-border hover:border-blue-500 hover:text-blue-500 transition-all gap-3 text-center h-32 text-muted hover:bg-blue-500/5 cursor-pointer"
          >
            <FolderPlus size={28} strokeWidth={1.5} />
            <span className="font-medium text-[13px]">Create New</span>
          </button>
        </div>
      </div>
    );
  };
