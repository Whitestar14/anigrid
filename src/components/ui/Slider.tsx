import React, { useCallback, useRef } from "react";
import { cn } from "@/utils";

export interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
}

/**
 * iOS-style slider. Uses a pure pointer-event approach so there is zero
 * React state thrashing on drag — the visual thumb is driven from an
 * inline style derivation only, keeping re-renders to the onChange call.
 */
export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  className,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const snap = (v: number) => Math.round(v / step) * step;
  const pct = ((clamp(value) - min) / (max - min)) * 100;

  const valueFromPointer = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return value;
    const { left, width } = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - left) / width));
    return snap(clamp(min + ratio * (max - min)));
  }, [min, max, step, value, snap, clamp]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    onChange(valueFromPointer(e.clientX));
  }, [valueFromPointer, onChange]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    onChange(valueFromPointer(e.clientX));
  }, [valueFromPointer, onChange]);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div
      ref={trackRef}
      className={cn(
        "relative flex items-center w-full h-5 cursor-pointer select-none touch-none",
        className
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Track background */}
      <div className="absolute inset-x-0 h-1 bg-white/20 rounded-full">
        {/* Fill */}
        <div
          className="h-full bg-white rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Thumb */}
      <div
        className="absolute h-[22px] w-[22px] -translate-x-1/2 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.45)] pointer-events-none"
        style={{ left: `${pct}%` }}
      />
    </div>
  );
};
