import React from "react";
import { LayoutGrid, Layers, Trash2, X } from "lucide-react";
import { SettingButtonGroup, SettingRow } from "@/components/ui/SettingCard";

interface ProjectHeaderSectionProps {
  projectType: "ranking" | "tierlist";
  onClearAll: () => void;
  onClose: () => void;
}

export const ProjectHeaderSection: React.FC<ProjectHeaderSectionProps> = ({
  projectType,
  onClearAll,
  onClose,
}) => {
  return (
    <div className="mx-4">
      <SettingButtonGroup className="glass-card rounded-[20px] overflow-hidden">
        <SettingRow
          as="div"
          icon={projectType === "tierlist" ? <Layers size={18} /> : <LayoutGrid size={18} />}
          iconBg={projectType === "tierlist" ? "bg-purple-500/20 text-purple-400" : "bg-primary/20 text-primary"}
          label={projectType === "tierlist" ? "Tier List" : "Ranking Grid"}
          sublabel="Project Type"
          right={
            <div className="flex items-center gap-1">
              <button
                onClick={onClearAll}
                className="p-1.5 hover:bg-red-500/10 rounded-full text-muted hover:text-red-500 transition-colors"
                title={`Clear ${projectType === "tierlist" ? "Tiers" : "Grid"}`}
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-hover rounded-full text-muted hover:text-text transition-colors md:hidden"
                title="Close Settings"
              >
                <X size={15} />
              </button>
            </div>
          }
        />
      </SettingButtonGroup>
    </div>
  );
};
