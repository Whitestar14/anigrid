import React from "react";
import { Hash, Type, Calendar, Droplets } from "lucide-react";
import { SettingButtonGroup, SettingRow } from "@/components/ui/SettingCard";
import { Toggle } from "@/components/ui/Toggle";
import { SectionHeader, settingsCardStyle } from "./SettingsParts";
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
    <div className="flex flex-col gap-2.5">
      <SectionHeader>Visibility</SectionHeader>

      {/* Rows rather than fields: every control here is a switch behind an icon
          chip, which is the idiom the rest of the app already uses for toggles.
          The header and the surface are shared with the other two sections, so
          the rail still reads as one object. */}
      <SettingButtonGroup
        className="mx-4 rounded-card overflow-hidden"
        style={settingsCardStyle}
      >
        {(projectType === "ranking" || projectType === "list") && (
          <SettingRow
            asLabel
            icon={<Hash size={15} />}
            iconBg="bg-primary/15 text-primary"
            label="Show Numbers"
            right={
              <Toggle
                checked={showNumbers}
                onCheckedChange={() => onVisualToggle("showNumbers")}
              />
            }
          />
        )}
        <SettingRow
          asLabel
          icon={<Type size={15} />}
          iconBg="bg-accent-green/15 text-accent-green"
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
          icon={<Calendar size={15} />}
          iconBg="bg-accent-orange/15 text-accent-orange"
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
          icon={<Droplets size={15} />}
          iconBg="bg-accent-purple/15 text-accent-purple"
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
