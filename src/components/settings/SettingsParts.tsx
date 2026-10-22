import React from "react";
import { Slider } from "@/components/ui/Slider";

/** Section header — label with a hairline rule extending to the rail edge. */
export const SectionHeader: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="flex items-center gap-3 px-5">
    <span
      className="text-caption-1 font-semibold text-muted shrink-0"
      style={{ letterSpacing: "0.055em", textTransform: "uppercase" }}
    >
      {children}
    </span>
    <div
      className="flex-1 h-px"
      style={{ backgroundColor: "var(--material-hairline)" }}
    />
  </div>
);

/** The one card surface every group of settings sits on. */
export const settingsCardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-surface-elevated)",
  boxShadow: "inset 0 0 0 0.5px var(--material-hairline)",
};

export const SettingsCard: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => (
  <div
    className={`mx-4 rounded-card overflow-hidden ${className ?? ""}`}
    style={settingsCardStyle}
  >
    {children}
  </div>
);

/**
 * A labelled field inside a settings card.
 * An optional value is echoed right-aligned next to the label.
 */
export const Field: React.FC<{
  label: string;
  value?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, value, children }) => (
  <div className="px-4 py-3.5 flex flex-col gap-2.5">
    <div className="flex items-center justify-between gap-3">
      <span className="text-footnote font-semibold text-text">{label}</span>
      {value !== undefined && (
        <span className="text-footnote font-semibold text-muted tabular-nums">
          {value}
        </span>
      )}
    </div>
    {children}
  </div>
);

/** A slider row with its label and live numeric readout. */
export const NumberedSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, step, suffix = "px", onChange }) => (
  <div className="px-4 pt-3.5 pb-3 flex flex-col gap-1.5">
    <div className="flex justify-between items-center">
      <span className="text-footnote font-semibold text-text">{label}</span>
      <span className="text-footnote font-semibold text-muted tabular-nums">
        {value}
        {suffix}
      </span>
    </div>
    {/* The visible label above is not a `<label>` and has no `htmlFor`, so the
        slider needs its own accessible name or it announces as "slider". */}
    <Slider
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
    />
  </div>
);
