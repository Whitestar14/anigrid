import React from "react";
import { ChevronDown, Globe, Image as ImageIcon } from "lucide-react";
import type { InboxTab } from "./types";

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
      className="h-12 flex items-center justify-between pl-5 pr-2 sm:pr-3 select-none shrink-0 border-b border-white/10 cursor-pointer"
      onClick={onToggleExpand}
    >
      <div className="flex items-center gap-4">
        <span className="text-[15px] font-semibold text-white">Library</span>

        <div className="flex items-center bg-[#767680]/24 rounded-xl p-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSelectTab("stash"); }}
            className={`
              flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all
              ${activeTab === "stash" ? "bg-[#636366] text-white shadow-sm" : "text-white/70 hover:text-white"}
            `}
          >
            <ImageIcon size={13} /> Stash
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSelectTab("search"); }}
            className={`
              flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all
              ${activeTab === "search" || activeTab === "picker" ? "bg-[#636366] text-white shadow-sm" : "text-white/70 hover:text-white"}
            `}
          >
            <Globe size={13} /> Search
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
        className="text-white/70 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
        title="Collapse dock"
      >
        <ChevronDown size={19} />
      </button>
    </div>
  );
};
