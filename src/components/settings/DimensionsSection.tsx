import React from "react";
import { NumberedSlider, SectionHeader, SettingsCard } from "./SettingsParts";
import { ProjectType } from "@/types";
import { DEFAULT_TIER_ROW_HEIGHT } from "@/utils/boardStyle";

interface DimensionsSectionProps {
  projectType: ProjectType;
  config: { rows: number; cols: number };
  cellWidth?: number | null;
  tierRowHeight?: number;
  onRowsChange: (v: number) => void;
  onColsChange: (v: number) => void;
  onCellWidthChange: (v: number) => void;
  onTierRowHeightChange: (v: number) => void;
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
 * A grid multiplies `rows` by `cols`; a list uses `rows` directly as its item
 * count. A tier list is measured in tiers, which it adds and removes inline, so
 * its only size control is how tall a row stands.
 */
export const DimensionsSection: React.FC<DimensionsSectionProps> = ({
  projectType,
  config,
  cellWidth,
  tierRowHeight,
  onRowsChange,
  onColsChange,
  onCellWidthChange,
  onTierRowHeightChange,
}) => {
  if (projectType === "tierlist") {
    return (
      <div className="flex flex-col gap-2.5">
        <SectionHeader>Dimensions</SectionHeader>
        <SettingsCard className="divide-y divide-hairline">
          {/* Sized by the thing the user is actually looking at. "Row height"
              described the box; the box exists to size the artwork in it, and
              nobody opens a tier list wanting to change a row. */}
          <NumberedSlider
            label="Image Size"
            value={tierRowHeight ?? DEFAULT_TIER_ROW_HEIGHT}
            min={56}
            max={180}
            step={4}
            onChange={onTierRowHeightChange}
          />
        </SettingsCard>
      </div>
    );
  }

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
               (`resolveBoardStyle` and the ⌘+/⌘− keys both fall back to it), so
               the slider starts where the board already is. */
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
