import React from "react";
import { SearchPanel } from "@/components/SearchPanel";
import type { JikanResult } from "@/types";

export interface InboxSearchViewProps {
  searchQuery: string;
  searchMode: "anime" | "characters";
  searchResults: JikanResult[];
  usedImageSrcs: Set<string>;
  onQueryChange: (q: string) => void;
  onModeChange: (m: "anime" | "characters") => void;
  onResultsChange: (r: JikanResult[]) => void;
  onSearchDragStart: (e: React.DragEvent, imageSrc: string) => void;
  onSearchDragEndExpand: () => void;
  onSmartAdd: (imageSrc: string) => void;
}

export const InboxSearchView: React.FC<InboxSearchViewProps> = ({
  searchQuery,
  searchMode,
  searchResults,
  usedImageSrcs,
  onQueryChange,
  onModeChange,
  onResultsChange,
  onSearchDragStart,
  onSearchDragEndExpand,
  onSmartAdd,
}) => (
  <div className="flex flex-1 min-h-0 flex-col p-4">
    <SearchPanel
      query={searchQuery}
      onQueryChange={onQueryChange}
      mode={searchMode}
      onModeChange={onModeChange}
      results={searchResults}
      onResultsChange={onResultsChange}
      onDragStart={onSearchDragStart}
      onDragEnd={onSearchDragEndExpand}
      onAdd={onSmartAdd}
      usedImageSrcs={usedImageSrcs}
    />
  </div>
);
