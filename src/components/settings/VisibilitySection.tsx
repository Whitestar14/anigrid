import React from "react";
import { Hash, Type, Calendar } from "lucide-react";
import { SettingButtonGroup, SettingRow } from "@/components/ui/SettingCard";
import { Toggle } from "@/components/ui/Toggle";
import { ProjectType } from "@/types";

interface VisibilitySectionProps {
  projectType: ProjectType;
  showNumbers: boolean;
  showTitle: boolean;
  showDate: boolean;
  onVisualToggle: (key: string) => void;
  showWatermark: boolean;
}

export const VisibilitySection: React.FC<VisibilitySectionProps> = ({
  projectType,
  showNumbers,
  showTitle,
  showDate,
  showWatermark,
  onVisualToggle,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-muted uppercase tracking-wide pl-4">
        Visibility
      </span>
      <SettingButtonGroup className="glass-card rounded-[20px] overflow-hidden mx-4">
        {(projectType === "ranking" || projectType === "list") && <SettingRow
          asLabel
          icon={<Hash size={16} />}
          iconBg="bg-primary/20 text-primary"
          label="Show Numbers"
          right={
            <Toggle
              checked={showNumbers}
              onCheckedChange={() => onVisualToggle("showNumbers")}
            />
          }
        />}
        <SettingRow
          asLabel
          icon={<Type size={16} />}
          iconBg="bg-green-500/20 text-green-400"
          label="Show Title"
          right={
            <Toggle
              checked={showTitle}
              onCheckedChange={() => onVisualToggle("showTitle")}
            />
          }
        />
        <SettingRow
          asLabel
          icon={<Calendar size={16} />}
          iconBg="bg-orange-500/20 text-orange-400"
          label="Show Date"
          right={
            <Toggle
              checked={showDate}
              onCheckedChange={() => onVisualToggle("showDate")}
            />
          }
        />
        <SettingRow
          asLabel
          icon={<Type size={16} />}
          iconBg="bg-purple-500/20 text-purple-400"
          label="Show Watermark"
          right={
            <Toggle
              checked={showWatermark}
              onCheckedChange={() => onVisualToggle("showWatermark")}
            />
          }
        />
      </SettingButtonGroup>
    </div>
  );
};
