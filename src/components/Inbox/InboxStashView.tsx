import React from "react";
import type { InboxCollection, InboxItem } from "@/types";
import type { InteractionState } from "@/types";
import { InboxStashToolbar } from "./InboxStashToolbar";
import { InboxStashGrid } from "./InboxStashGrid";

export interface InboxStashViewProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  collections: InboxCollection[];
  activeCollectionId: string;
  currentItems: InboxItem[];
  isAllView: boolean;
  usedOnBoard: Set<string>;
  selectedItemIds: Set<string>;
  interactionState: InteractionState;
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
  onUploadClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEndExpand: () => void;
  onItemClick: (e: React.MouseEvent, itemId: string) => void;
  onDeleteItem: (item: InboxItem) => void;
}

export const InboxStashView: React.FC<InboxStashViewProps> = (props) => (
  <div className="flex-1 min-h-0 flex flex-col">
    <InboxStashToolbar
      selectedItemIds={props.selectedItemIds}
      collections={props.collections}
      activeCollectionId={props.activeCollectionId}
      editingNameId={props.editingNameId}
      tempName={props.tempName}
      onSwitchCollection={props.onSwitchCollection}
      onAddCollection={props.onAddCollection}
      onStartRename={props.onStartRename}
      onTempNameChange={props.onTempNameChange}
      onCommitRename={props.onCommitRename}
      onRequestDeleteCollection={props.onRequestDeleteCollection}
      onBulkDelete={props.onBulkDelete}
      onClearSelection={props.onClearSelection}
    />
    <InboxStashGrid
      fileInputRef={props.fileInputRef}
      currentItems={props.currentItems}
      isAllView={props.isAllView}
      usedOnBoard={props.usedOnBoard}
      selectedItemIds={props.selectedItemIds}
      interactionState={props.interactionState}
      onUploadClick={props.onUploadClick}
      onFileChange={props.onFileChange}
      onDragStart={props.onDragStart}
      onDragEndExpand={props.onDragEndExpand}
      onItemClick={props.onItemClick}
      onDeleteItem={props.onDeleteItem}
    />
  </div>
);
