import React from "react";
import { SearchPanel } from "@/components/SearchPanel";
import type { SearchMode, SourcePreference } from "@/core/metadata";

export interface InboxSearchViewProps {
  searchQuery: string;
  searchMode: SearchMode;
  usedImageSrcs: Set<string>;
  onQueryChange: (q: string) => void;
  onModeChange: (m: SearchMode) => void;
  onSmartAdd: (imageSrc: string) => void;
  autoFocus?: boolean;
  searchSource?: SourcePreference;
  onSearchSourceChange?: (source: SourcePreference) => void;
}

export const InboxSearchView: React.FC<InboxSearchViewProps> = ({
  searchQuery,
  searchMode,
  usedImageSrcs,
  onQueryChange,
  onModeChange,
  onSmartAdd,
  autoFocus,
  searchSource,
  onSearchSourceChange,
}) => (
  <div className="flex flex-1 min-h-0 flex-col px-4 pt-2 pb-2">
    <SearchPanel
      query={searchQuery}
      onQueryChange={onQueryChange}
      mode={searchMode}
      onModeChange={onModeChange}
      onAdd={onSmartAdd}
      usedImageSrcs={usedImageSrcs}
      autoFocus={autoFocus}
      imageSource={searchSource}
      onImageSourceChange={onSearchSourceChange}
    />
  </div>
);
