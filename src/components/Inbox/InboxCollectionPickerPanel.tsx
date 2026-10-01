import React from "react";
import { ArrowLeft, Check, Edit2, FolderPlus, Package } from "lucide-react";
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
    <div className="absolute inset-0 bg-surface flex flex-col animate-in fade-in slide-in-from-right-4 z-20">
      <header className="flex items-center gap-1 pl-1 pr-3 h-12 shrink-0 border-b border-hairline">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to search"
          className="grid place-items-center w-9 h-9 rounded-full text-primary hover:bg-hover transition-colors touch-target"
        >
          <ArrowLeft size={19} />
        </button>
        <h3 className="text-headline font-semibold text-text">
          Add to collection
        </h3>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar p-3">
        <div className="material-card rounded-card overflow-hidden">
          {collections.map((col, i) => {
            const isEditing = editingNameId === col.id;
            const isRecent = col.id === lastTargetCollectionId;
            const count = col.items?.length ?? 0;

            return (
              <div
                key={col.id}
                className={`flex items-stretch transition-colors duration-150 ${
                  isEditing ? "" : "hover:bg-hover"
                }`}
                style={
                  i < collections.length - 1
                    ? { borderBottom: "0.5px solid var(--material-hairline)" }
                    : undefined
                }
              >
                {isEditing ? (
                  <div className="flex-1 flex items-center gap-3 px-3 py-2.5">
                    <Package size={16} className="text-muted shrink-0" />
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
                      aria-label="Collection name"
                      className="flex-1 min-w-0 h-8 px-2 rounded-chip bg-background text-subheadline
                                 font-semibold text-text outline-none focus-visible:focus-ring"
                    />
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onPickCollection(col.id)}
                      className="flex-1 min-w-0 flex items-center gap-3 px-3 py-2.5 text-left"
                    >
                      <span
                        className="grid place-items-center w-8 h-8 rounded-chip squircle shrink-0"
                        style={{
                          backgroundColor: isRecent
                            ? "color-mix(in srgb, var(--color-primary) 18%, transparent)"
                            : "var(--color-surface-secondary)",
                          color: isRecent ? "var(--color-primary)" : "var(--color-muted)",
                        }}
                      >
                        <Package size={15} strokeWidth={2.2} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-subheadline font-semibold text-text">
                          {col.name}
                        </span>
                        <span className="block text-caption-1 text-muted">
                          {count} {count === 1 ? "image" : "images"}
                          {isRecent && (
                            <span className="text-primary"> · Added last time</span>
                          )}
                        </span>
                      </span>
                      {isRecent && (
                        <Check
                          size={16}
                          strokeWidth={3}
                          className="text-primary shrink-0"
                        />
                      )}
                    </button>

                    <button
                      type="button"
                      aria-label={`Rename ${col.name}`}
                      onClick={() => onStartRename(col.id, col.name)}
                      className="shrink-0 grid place-items-center w-11 text-muted
                                 hover:text-text transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onAddCollection}
          className="mt-3 w-full flex items-center gap-3 px-3 py-3 rounded-card
                     border border-dashed border-hairline text-muted
                     hover:text-primary hover:border-primary hover:bg-primary/5
                     transition-colors duration-150"
        >
          <FolderPlus size={17} />
          <span className="text-subheadline font-medium">New collection</span>
        </button>
      </div>
    </div>
  );
};
