import React from "react";
import { NumberedSlider, SectionHeader, SettingsCard } from "./SettingsParts";
import { ProjectType } from "@/types";

interface DimensionsSectionProps {
  /** Only a ranking or a list reaches this section — see GridSettingsSidebar. */
  projectType: Extract<ProjectType, "ranking" | "list">;
  config: { rows: number; cols: number };
  cellWidth: number | null | undefined;
  onRowsChange: (v: number) => void;
  onColsChange: (v: number) => void;
  onCellWidthChange: (v: number) => void;
}

/** One centred numeric stepper. A grid shows two of them side by side. */
const NumberInput: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, onChange }) => (
  <div className="flex-1 flex flex-col gap-1 items-center">
    <span
      className="text-caption-2 font-semibold text-muted"
      style={{ letterSpacing: "0.05em", textTransform: "uppercase" }}
    >
      {label}
    </span>
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="text-center font-semibold bg-transparent text-text focus:outline-none w-full text-title-3 tabular-nums"
    />
  </div>
);

/**
 * How big the board is.
 *
 * `handleConfigChange` reads `rows` for both project types — a grid multiplies
 * it by `cols`, a list uses it directly as its item count — so both get this
 * section. It used to be rendered for rankings only, which left a list's length
 * with no control at all even though the store already honoured one.
 */
export const DimensionsSection: React.FC<DimensionsSectionProps> = ({
  projectType,
  config,
  cellWidth,
  onRowsChange,
  onColsChange,
  onCellWidthChange,
}) => {
  const isRanking = projectType === "ranking";

  return (
    <div className="flex flex-col gap-2.5">
      <SectionHeader>Dimensions</SectionHeader>

      <SettingsCard className="divide-y divide-hairline">
        <div className="px-4 py-3.5 flex items-center gap-3">
          <NumberInput
            label={isRanking ? "Rows" : "Items"}
            value={config.rows}
            min={1}
            max={50}
            onChange={onRowsChange}
          />

          {isRanking && (
            <>
              <span className="text-muted font-light text-title-2 pb-1">×</span>
              <NumberInput
                label="Cols"
                value={config.cols}
                min={1}
                max={20}
                onChange={onColsChange}
              />
            </>
          )}
        </div>

        {/* Cell width sizes a grid tile. A list row sizes itself from its
            aspect ratio, so the slider is a ranking-only control — offering it
            on a list would be a knob with nothing on the other end. */}
        {isRanking && (
          <NumberedSlider
            label="Cell Width"
            /* 240 is the width a tile renders at when this has never been set
               (`GridView` and the ⌘+/⌘− keys both fall back to it), so the
               slider starts where the board already is instead of at the far
               left of the track. */
            value={cellWidth ?? 240}
            min={60}
            max={300}
            step={5}
            onChange={onCellWidthChange}
          />
        )}
      </SettingsCard>
    </div>
  );
};
