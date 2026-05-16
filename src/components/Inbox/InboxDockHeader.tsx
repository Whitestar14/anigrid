import React from "react";
import { ChevronDown, Globe, Image as ImageIcon } from "lucide-react";
import type { InboxTab } from "./types";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

export interface InboxDockHeaderProps {
  activeTab: InboxTab;
  onToggleExpand: () => void;
  onSelectTab: (tab: Exclude<InboxTab, "picker">) => void;
}

export const InboxDockHeader: React.FC<InboxDockHeaderProps> = ({
  activeTab,
  onToggleExpand,
  onSelectTab,
}) => {
  return (
    <div
      className="h-12 flex items-center justify-between pl-5 pr-1 sm:pr-2 select-none shrink-0 border-b border-border cursor-pointer"
      onClick={onToggleExpand}
    >
      <div className="flex items-center gap-4">
        <span className="text-[15px] font-semibold text-text">Library</span>

        <SegmentedControl
          value={activeTab === "picker" ? "search" : activeTab}
          onChange={(val) => onSelectTab(val as any)}
          options={[
            { value: "stash", label: "stash", icon: <ImageIcon size={14} /> },
            { value: "search", label: "search", icon: <Globe size={14} /> }
          ]}
        />
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
        className="text-muted hover:text-text transition-colors p-1.5 rounded-full hover:bg-hover"
        title="Collapse dock"
      >
        <ChevronDown size={19} />
      </button>
    </div>
  );
};
