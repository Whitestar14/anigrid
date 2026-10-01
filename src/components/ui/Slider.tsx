import React, { useCallback, useRef } from "react";
import { cn } from "@/utils";

export interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  "aria-label"?: string;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  className,
  "aria-label": ariaLabel,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const clamp = useCallback(
    (v: number) => Math.max(min, Math.min(max, v)),
    [min, max]
  );
  const snap = useCallback(
    (v: number) => Math.round(v / step) * step,
    [step]
  );

  const safe = clamp(value);
  const pct = max === min ? 0 : ((safe - min) / (max - min)) * 100;

  const valueFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return safe;
      const { left, width } = track.getBoundingClientRect();
      if (width === 0) return safe;
      const ratio = Math.max(0, Math.min(1, (clientX - left) / width));
      return snap(clamp(min + ratio * (max - min)));
    },
    [min, max, snap, clamp, safe]
  );

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={safe}
      tabIndex={0}
      className={cn(
        // 44pt tall hit area; the visible track stays 4pt and stays centred.
        "relative flex items-center w-full h-11 cursor-pointer select-none touch-none",
        "outline-none focus-visible:focus-ring rounded-full",
        className
      )}
      onKeyDown={(e) => {
        const big = step * 10;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          onChange(clamp(safe + step));
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          onChange(clamp(safe - step));
        } else if (e.key === "PageUp") {
          e.preventDefault();
          onChange(clamp(safe + big));
        } else if (e.key === "PageDown") {
          e.preventDefault();
          onChange(clamp(safe - big));
        } else if (e.key === "Home") {
          e.preventDefault();
          onChange(min);
        } else if (e.key === "End") {
          e.preventDefault();
          onChange(max);
        }
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        isDragging.current = true;
        onChange(valueFromPointer(e.clientX));
      }}
      onPointerMove={(e) => {
        if (isDragging.current) onChange(valueFromPointer(e.clientX));
      }}
      onPointerUp={() => {
        isDragging.current = false;
      }}
      onPointerCancel={() => {
        isDragging.current = false;
      }}
    >
      <div
        className="absolute inset-x-0 h-1 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--color-surface-secondary)" }}
      >
        <div
          className="h-full bg-primary rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div
        /* Positioned with `left` but deliberately not transitioned: the thumb
           must track the finger exactly, and animating `left` would drive a
           layout pass per frame. */
        className="absolute h-[26px] w-[26px] -translate-x-1/2 rounded-full bg-white pointer-events-none"
        style={{
          left: `${pct}%`,
          boxShadow:
            "0 3px 8px rgba(0,0,0,0.18), 0 1px 1px rgba(0,0,0,0.16), inset 0 0 0 0.5px rgba(0,0,0,0.04)",
        }}
      />
    </div>
  );
};
