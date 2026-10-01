import React from "react";
import { Maximize2, Grid, SquareDashedKanban, Square, Palette } from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Slider } from "@/components/ui/Slider";
import { ColorPicker } from "@/components/ui/ColorPicker";
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

/** Uppercase grouped-list header, matching iOS section headers. */
const SectionHeader: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <span className="text-footnote font-medium text-muted uppercase tracking-wide pl-4">
    {children}
  </span>
);

/** Field label above a control, with an optional value shown alongside it. */
const Field: React.FC<{
  label: string;
  /** Current value, echoed next to the label — the header for glyph controls. */
  value?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, value, children }) => (
  <div className="px-4 py-3 flex flex-col gap-2">
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-caption-2 font-semibold text-muted uppercase tracking-[0.04em]">
        {label}
      </span>
      {value !== undefined && (
        <span className="text-caption-1 font-semibold text-muted tabular-nums">
          {value}
        </span>
      )}
    </div>
    {children}
  </div>
);

const NumberedSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, step, suffix = "px", onChange }) => (
  <div className="px-4 py-3 flex flex-col gap-2">
    <div className="flex justify-between items-center text-footnote font-medium text-text">
      <span>{label}</span>
      <span className="text-muted tabular-nums">
        {value}
        {suffix}
      </span>
    </div>
    <Slider min={min} max={max} step={step} value={value} onChange={onChange} />
  </div>
);

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
  // Only ranking and list projects expose tile styling; a tier list has its
  // own row layout.
  const supportsTileStyle =
    projectType === "ranking" || projectType === "list";

  const radius = borderRadius && borderRadius > 0 ? borderRadius : DEFAULT_RADIUS;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader>Appearance</SectionHeader>

      <div className="mx-4 material-card rounded-card overflow-hidden divide-y divide-hairline">
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
            <Field
              label={projectType === "list" ? "List Style" : "Grid Style"}
            >
              <SegmentedControl
                value={style}
                onChange={(val) =>
                  // Seamless is a collage: square corners, tiles touching.
                  // Card re-seeds a visible radius and gutter, otherwise a board
                  // switched from seamless would stay square and gapless.
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

        <Field label="Alignment">
          <SegmentedControl
            value={gridJustify || "center"}
            onChange={(val) => onUpdateRank({ gridJustify: val })}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
          />
        </Field>

        <Field label="Background">
          <div className="flex flex-wrap gap-2">
            {GRID_BG_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onUpdateRank({ backgroundColor: color })}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  rankBackgroundColor === color
                    ? "border-primary scale-110"
                    : "border-border hover:border-text"
                }`}
                style={swatchStyle(color)}
                title={color === "transparent" ? "Transparent" : color}
              />
            ))}
            <label
              className={`relative w-6 h-6 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                !GRID_BG_COLORS.includes(rankBackgroundColor)
                  ? "border-primary scale-110"
                  : "border-border hover:border-text"
              }`}
              style={{
                backgroundColor: !GRID_BG_COLORS.includes(rankBackgroundColor)
                  ? rankBackgroundColor
                  : "var(--color-surface-secondary)",
              }}
              title="Custom Color"
            >
              {/* `mix-blend-difference` over the chosen colour keeps the glyph
                  visible on any swatch, so it is white-on-dark / black-on-light
                  automatically. It only needs a neutral to blend against. */}
              <Palette size={12} className="text-white mix-blend-difference" />
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
        </Field>
      </div>
    </div>
  );
};
