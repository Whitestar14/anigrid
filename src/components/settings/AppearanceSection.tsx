import React from "react";
import { Maximize2, Grid, SquareDashedKanban, Square, Palette } from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Slider } from "@/components/ui/Slider";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { RankMode } from "@/types";

const GRID_BG_COLORS = [
  "transparent",
  "#ffffff",
  "#0f1115",
  "#181b21",
  "#1a202c",
  "#2d3748",
  "#000000",
];

interface AppearanceSectionProps {
  projectType: "ranking" | "tierlist";
  mode: RankMode;
  aspectRatio: string;
  style: "card" | "seamless";
  borderless: boolean;
  gap: number;
  gridJustify?: "left" | "center" | "right";
  rankBackgroundColor: string;
  onUpdateRank: (updates: any) => void;
}

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({
  projectType,
  mode,
  aspectRatio,
  style,
  borderless,
  gap,
  gridJustify,
  rankBackgroundColor,
  onUpdateRank,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <span className="text-[13px] font-medium text-muted uppercase tracking-wide pl-4">
        Appearance
      </span>

      <div className="mx-4 glass-card rounded-[20px] overflow-hidden divide-y divide-border/50">
        <div className="px-4 py-3 flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-muted uppercase tracking-wide">Aspect Ratio</span>
          <SegmentedControl
            value={aspectRatio || "3:4"}
            onChange={(val) => onUpdateRank({ aspectRatio: val })}
            options={(["1:1", "3:4", "4:3", "16:9", "9:16"] as const).map(ratio => ({ value: ratio, label: ratio }))}
          />
        </div>
        {projectType === "ranking" && (
          <>
            <div className="px-4 py-3 flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted uppercase tracking-wide">{mode === "list" ? "List Style" : "Grid Style"}</span>
              <SegmentedControl
                value={style}
                onChange={(val) => onUpdateRank(val === "seamless" ? { style: "seamless", borderRadius: 0 } : { style: "card" })}
                options={[
                  { value: "seamless", label: "Seamless", icon: <Maximize2 size={14} /> },
                  { value: "card", label: "Card", icon: <Grid size={14} /> }
                ]}
              />
            </div>
            <div className="px-4 py-3 flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted uppercase tracking-wide">Borders</span>
              <SegmentedControl
                value={borderless ? "true" : "false"}
                onChange={(val) => onUpdateRank({ borderless: val === "true" })}
                options={[
                  { value: "false", label: "Visible", icon: <SquareDashedKanban size={14} /> },
                  { value: "true", label: "Hidden", icon: <Square size={14} /> }
                ]}
              />
            </div>
            <div className="px-4 py-3 flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[13px] font-medium text-text">
                <span>Gap</span>
                <span className="text-muted text-[13px]">{gap}px</span>
              </div>
              <Slider min={0} max={32} step={2} value={gap} onChange={(v) => onUpdateRank({ gap: v })} />
            </div>
            <div className="px-4 py-3 flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted uppercase tracking-wide">Alignment</span>
              <SegmentedControl
                value={gridJustify || "center"}
                onChange={(val) => onUpdateRank({ gridJustify: val })}
                options={[
                  { value: "left", label: "Left" },
                  { value: "center", label: "Center" },
                  { value: "right", label: "Right" }
                ]}
              />
            </div>
          </>
        )}
        <div className="px-4 py-3 flex flex-col gap-2">
          <span className="text-[11px] font-medium text-muted uppercase tracking-wide">Background</span>
          <div className="flex flex-wrap gap-2">
            {GRID_BG_COLORS.map((color) => (
              <button key={color} onClick={() => onUpdateRank({ backgroundColor: color })} className={`w-6 h-6 rounded-full border-2 transition-all ${rankBackgroundColor === color ? "border-primary scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" : "border-border hover:border-text"}`} style={{ backgroundColor: color === "transparent" ? "#000" : color, backgroundImage: color === "transparent" ? "repeating-conic-gradient(#333 0% 25%, #222 0% 50%)" : "" }} title={color === "transparent" ? "Transparent" : color} />
            ))}
            <label className={`relative w-6 h-6 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${!GRID_BG_COLORS.includes(rankBackgroundColor) ? "border-primary scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" : "border-border hover:border-text"}`} style={{ backgroundColor: !GRID_BG_COLORS.includes(rankBackgroundColor) ? rankBackgroundColor : "#2c2c2e" }} title="Custom Color">
              <Palette size={12} className="text-white mix-blend-difference" />
              <ColorPicker value={!GRID_BG_COLORS.includes(rankBackgroundColor) ? rankBackgroundColor : "#000000"} onChange={(v) => onUpdateRank({ backgroundColor: v })} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
