import React from "react";
import { InboxCollectionPickerPanel } from "../InboxCollectionPickerPanel";
import { InboxStashToolbar } from "../InboxStashToolbar";
import { InboxStashGrid } from "../InboxStashGrid";
import { SettingsDockPanel } from "../SettingsDockPanel";
import { SearchPanel } from "@/components/SearchPanel";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Image as ImageIcon, Globe } from "lucide-react";
import { DockHeader } from "./DockHeader";
import type { DockCtrl } from "./types";

interface DockExpandedContentProps {
  ctrl: DockCtrl;
  /** Focus the search field once, right after the dock is opened onto it. */
  autoFocusSearch: boolean;
  requestConfirm?: (
    title: string,
    message: string,
    onConfirm: () => void
  ) => void;
  onOpenAbout?: () => void;
}

/**
 * The panel that fills the dock while it is open.
 *
 * Every surface used to sit behind its own thin wrapper that existed only to
 * forward props — `InboxStashView`, `InboxSearchView`, and two separate
 * headers. Each surface now takes the dock controller directly, which is what
 * makes the prop lists here short enough to read at a glance.
 */
export const DockExpandedContent: React.FC<DockExpandedContentProps> = ({
  ctrl,
  autoFocusSearch,
  requestConfirm,
  onOpenAbout,
}) => {
  const commitRename = (colId: string) => {
    if (ctrl.tempName.trim()) ctrl.renameCollection(colId, ctrl.tempName);
    ctrl.setEditingNameId(null);
  };

  const startRename = (id: string, name: string) => {
    ctrl.setEditingNameId(id);
    ctrl.setTempName(name);
  };

  if (ctrl.dockSurface === "settings") {
    return (
      <div className="flex flex-col w-full h-full grow-0 shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <DockHeader title="Settings" onCollapse={ctrl.toggleExpand} />
        <SettingsDockPanel
          requestConfirm={requestConfirm}
          onOpenAbout={onOpenAbout}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full grow-0 shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <DockHeader title="Library" onCollapse={ctrl.toggleExpand}>
        {/* `hug` + Title Case so these read as the same control as every other
            segmented switch in the app. */}
        <div onClick={(e) => e.stopPropagation()}>
          <SegmentedControl
            hug
            value={ctrl.activeTab === "picker" ? "search" : ctrl.activeTab}
            onChange={(val) => {
              ctrl.setActiveTab(val as "stash" | "search");
              ctrl.setIsExpanded(true);
            }}
            options={[
              { value: "stash", label: "Stash", icon: <ImageIcon size={14} /> },
              { value: "search", label: "Search", icon: <Globe size={14} /> },
            ]}
          />
        </div>
      </DockHeader>

      <div className="flex-1 overflow-hidden relative flex flex-col min-h-0 bg-surface-secondary">
        <div className="flex-1 min-h-0 flex flex-col relative">
          {ctrl.activeTab === "picker" && (
            <InboxCollectionPickerPanel
              collections={ctrl.collections}
              lastTargetCollectionId={ctrl.lastTargetCollectionId}
              editingNameId={ctrl.editingNameId}
              tempName={ctrl.tempName}
              onBack={() => ctrl.setActiveTab("search")}
              onPickCollection={ctrl.handleCollectionPick}
              onAddCollection={ctrl.addCollection}
              onStartRename={startRename}
              onTempNameChange={ctrl.setTempName}
              onCommitRename={commitRename}
              onCancelRename={() => ctrl.setEditingNameId(null)}
            />
          )}

          {/* Hidden rather than unmounted: the search field and its scroll
              position should survive a trip to the stash and back. */}
          <div
            className={`flex-1 min-h-0 ${
              ctrl.activeTab === "search" ? "flex flex-col" : "hidden"
            }`}
          >
            <div className="flex flex-1 min-h-0 flex-col px-4 pt-2 pb-2">
              <SearchPanel
                query={ctrl.searchQuery}
                onQueryChange={ctrl.setSearchQuery}
                mode={ctrl.searchMode}
                onModeChange={ctrl.setSearchMode}
                onAdd={ctrl.handleSmartAdd}
                usedImageSrcs={ctrl.usedImageSrcs}
                autoFocus={autoFocusSearch}
                imageSource={ctrl.searchSource}
                onImageSourceChange={ctrl.setSearchSource}
              />
            </div>
          </div>

          <div
            className={`flex-1 min-h-0 ${
              ctrl.activeTab === "stash" ? "flex flex-col" : "hidden"
            }`}
          >
            <div className="flex-1 min-h-0 flex flex-col">
              <InboxStashToolbar ctrl={ctrl} />
              <InboxStashGrid ctrl={ctrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};