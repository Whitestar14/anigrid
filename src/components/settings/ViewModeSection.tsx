import React from "react";
import { LayoutGrid, List } from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

import { RankMode } from "@/types";

interface ViewModeSectionProps {
  mode: RankMode;
  onModeChange: (mode: "list" | "grid") => void;
}

export const ViewModeSection: React.FC<ViewModeSectionProps> = ({ mode, onModeChange }) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-muted uppercase tracking-wide pl-4">
        View Mode
      </span>
      <div className="mx-4">
        <SegmentedControl
          value={mode}
          onChange={(val) => onModeChange(val as "list" | "grid")}
          options={[
            { value: "grid", label: "Grid", icon: <LayoutGrid size={14} /> },
            { value: "list", label: "List", icon: <List size={14} /> }
          ]}
        />
      </div>
    </div>
  );
};
