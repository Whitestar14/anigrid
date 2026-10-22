import React from "react";
import { Maximize2, Grid, SquareDashedKanban, Square, Palette } from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Field, NumberedSlider, SectionHeader, SettingsCard } from "./SettingsParts";
import { ProjectType, Rank } from "@/types";

const GRID_BG_COLORS = [
  "transparent",
  "#ffffff",
  "#f2f2f7",
  "#e5e5ea",
  "#1c1c1e",
  "#0f1115",
  "#181b21",
  "#1a202c",
  "#2d3748",
  "#000000",
];

/** The chequerboard that stands for "no background", in both appearances. */
const TRANSPARENT_SWATCH: React.CSSProperties = {
  backgroundColor: "var(--color-surface)",
  backgroundImage:
    "repeating-conic-gradient(var(--material-hairline) 0% 25%, transparent 0% 50%)",
  backgroundSize: "8px 8px",
};

const swatchStyle = (color: string): React.CSSProperties =>
  color === "transparent" ? TRANSPARENT_SWATCH : { backgroundColor: color };

const DEFAULT_RADIUS = 16;
const DEFAULT_CARD_GAP = 8;

const ASPECT_RATIOS = ["1:1", "3:4", "4:3", "16:9", "9:16"] as const;
type AspectRatio = (typeof ASPECT_RATIOS)[number];

/** Longest edge of the glyph drawn for a ratio, in px. */
const GLYPH_MAX = 22;

const AspectGlyph: React.FC<{ ratio: AspectRatio; active: boolean }> = ({
  ratio,
  active,
}) => {
  const [w, h] = ratio.split(":").map(Number);
  const scale = GLYPH_MAX / Math.max(w, h);
  return (
    <span
      aria-hidden
      className="block squircle"
      style={{
        width: Math.max(9, Math.round(w * scale)),
        height: Math.max(9, Math.round(h * scale)),
        borderRadius: 4,
        border: `1.5px solid ${
          active ? "var(--color-primary)" : "var(--color-faint)"
        }`,
        backgroundColor: active
          ? "color-mix(in srgb, var(--color-primary) 22%, transparent)"
          : "transparent",
        transition:
          "border-color var(--duration-quick) var(--ease-standard), background-color var(--duration-quick) var(--ease-standard)",
      }}
    />
  );
};

interface AppearanceSectionProps {
  projectType: ProjectType;
  aspectRatio: string;
  style: "card" | "seamless";
  borderless: boolean;
  gap: number;
  borderRadius?: number;
  gridJustify?: "left" | "center" | "right";
  rankBackgroundColor: string;
  onUpdateRank: (updates: Partial<Rank>) => void;
}

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({
  projectType,
  aspectRatio,
  style,
  borderless,
  gap,
  borderRadius,
  gridJustify,
  rankBackgroundColor,
  onUpdateRank,
}) => {
  const supportsTileStyle =
    projectType === "ranking" || projectType === "list";

  const radius = borderRadius && borderRadius > 0 ? borderRadius : DEFAULT_RADIUS;

  return (
    <div className="flex flex-col gap-2.5">
      <SectionHeader>Appearance</SectionHeader>

      <SettingsCard className="divide-y divide-hairline">

        <Field label="Aspect Ratio" value={aspectRatio || "3:4"}>
          <SegmentedControl
            value={(aspectRatio || "3:4") as AspectRatio}
            onChange={(val) => onUpdateRank({ aspectRatio: val })}
            options={ASPECT_RATIOS.map((ratio) => ({
              value: ratio,
              label: (
                <AspectGlyph
                  ratio={ratio}
                  active={(aspectRatio || "3:4") === ratio}
                />
              ),
              ariaLabel: `${ratio} aspect ratio`,
            }))}
          />
        </Field>

        {supportsTileStyle && (
          <>
            <Field label={projectType === "list" ? "List Style" : "Grid Style"}>
              <SegmentedControl
                value={style}
                onChange={(val) =>
                  val === "seamless"
                    ? onUpdateRank({ style: "seamless" })
                    : onUpdateRank({
                        style: "card",
                        borderRadius: radius,
                        gap: gap || DEFAULT_CARD_GAP,
                      })
                }
                options={[
                  {
                    value: "seamless",
                    label: "Seamless",
                    icon: <Maximize2 size={14} />,
                  },
                  { value: "card", label: "Card", icon: <Grid size={14} /> },
                ]}
              />
            </Field>

            {style === "card" && (
              <NumberedSlider
                label="Corner Radius"
                value={radius}
                min={0}
                max={32}
                step={2}
                onChange={(v) => onUpdateRank({ borderRadius: v })}
              />
            )}

            <Field label="Borders">
              <SegmentedControl
                value={borderless ? "true" : "false"}
                onChange={(val) => onUpdateRank({ borderless: val === "true" })}
                options={[
                  {
                    value: "false",
                    label: "Visible",
                    icon: <SquareDashedKanban size={14} />,
                  },
                  { value: "true", label: "Hidden", icon: <Square size={14} /> },
                ]}
              />
            </Field>

            <NumberedSlider
              label="Gap"
              value={gap}
              min={0}
              max={32}
              step={2}
              onChange={(v) => onUpdateRank({ gap: v })}
            />
          </>
        )}

        {/* Alignment is read by exactly one view: the tier list, which
            justifies the tiles inside a row. A ranking grid and a list both hug
            their own content, so there is nothing for this to move — it showed
            up for every project type, saved a value, and changed nothing. It is
            offered only where the layout can honour it. */}
        {projectType === "tierlist" && (
          <Field label="Alignment">
            <SegmentedControl
              value={gridJustify || "left"}
              onChange={(val) => onUpdateRank({ gridJustify: val })}
              options={[
                { value: "left", label: "Left" },
                { value: "center", label: "Center" },
                { value: "right", label: "Right" },
              ]}
            />
          </Field>
        )}

        {/* Background colour picker */}
        <div className="px-4 py-3.5 flex flex-col gap-3">
          <span className="text-footnote font-semibold text-text">Background</span>
          <div className="flex flex-wrap gap-2.5">
            {GRID_BG_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onUpdateRank({ backgroundColor: color })}
                className="relative w-7 h-7 rounded-full transition-transform duration-150"
                style={{
                  ...swatchStyle(color),
                  boxShadow:
                    rankBackgroundColor === color
                      ? `0 0 0 2px var(--color-background), 0 0 0 3.5px var(--color-primary)`
                      : `inset 0 0 0 1px var(--material-hairline)`,
                  transform: rankBackgroundColor === color ? "scale(1.1)" : "scale(1)",
                }}
                title={color === "transparent" ? "Transparent" : color}
              />
            ))}

            {/* Custom colour swatch */}
            <label
              className="relative w-7 h-7 rounded-full cursor-pointer flex items-center justify-center transition-transform duration-150"
              style={{
                backgroundColor: !GRID_BG_COLORS.includes(rankBackgroundColor)
                  ? rankBackgroundColor
                  : "var(--color-surface-secondary)",
                boxShadow: !GRID_BG_COLORS.includes(rankBackgroundColor)
                  ? `0 0 0 2px var(--color-background), 0 0 0 3.5px var(--color-primary)`
                  : `inset 0 0 0 1px var(--material-hairline)`,
                transform: !GRID_BG_COLORS.includes(rankBackgroundColor)
                  ? "scale(1.1)"
                  : "scale(1)",
              }}
              title="Custom Color"
            >
              {/* mix-blend-difference keeps the icon legible on any bg colour */}
              <Palette size={13} className="text-white mix-blend-difference" />
              <ColorPicker
                value={
                  !GRID_BG_COLORS.includes(rankBackgroundColor)
                    ? rankBackgroundColor
                    : "#000000"
                }
                onChange={(v) => onUpdateRank({ backgroundColor: v })}
              />
            </label>
          </div>
        </div>

      </SettingsCard>
    </div>
  );
};
