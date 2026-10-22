import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { motion as motionPreset } from "@/lib/motion";
import { cn } from "@/utils";
import { TIER_COLORS } from "@/constants/tierColors";

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export const hexToHsv = (hex: string): { h: number; s: number; v: number } => {
  const value = /^#?[0-9a-f]{6}$/i.test(hex) ? hex.replace("#", "") : "000000";
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s: max === 0 ? 0 : delta / max, v: max };
};

export const hsvToHex = (h: number, s: number, v: number): string => {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rgb: [number, number, number];

  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];

  return (
    "#" +
    rgb
      .map((channel) =>
        Math.round((channel + m) * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
};

const isHex = (value: string) =>
  /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());

export interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  /**
   * The visible swatch. It is wrapped in a real button, so it must not be
   * interactive itself. Omit for a standard well.
   */
  trigger?: React.ReactNode;
  /** Extra classes for the trigger button (sizing, radius). */
  className?: string;
  label?: string;
  disabled?: boolean;
  /** Swatches offered above the hex field. Defaults to the tier palette. */
  presets?: readonly string[];
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  trigger,
  className,
  label = "Colour",
  disabled = false,
  presets = TIER_COLORS,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  const [draft, setDraft] = useState(value);
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const [coords, setCoords] = useState<{
    x: number;
    y: number;
    above: boolean;
  } | null>(null);

  /* Re-sync when the value changes from outside (a preset, an undo, another
     panel). Compared as hex so dragging inside this panel — which writes the
     same value straight back — cannot fight the pointer. */
  useEffect(() => {
    setDraft(value);
    setHsv((prev) =>
      hsvToHex(prev.h, prev.s, prev.v) === value.toLowerCase()
        ? prev
        : hexToHsv(value),
    );
  }, [value]);

  const commit = useCallback(
    (next: { h: number; s: number; v: number }) => {
      setHsv(next);
      const hex = hsvToHex(next.h, next.s, next.v);
      setDraft(hex);
      onChange(hex);
    },
    [onChange],
  );

  useLayoutEffect(() => {
    if (!isOpen) return;

    const place = () => {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;

      const anchor = trigger.getBoundingClientRect();
      const size = panel.getBoundingClientRect();
      const padding = 10;
      const gap = 8;
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight;
      const viewportWidth = window.visualViewport?.width ?? window.innerWidth;

      const above =
        anchor.bottom + gap + size.height > viewportHeight - padding &&
        anchor.top - gap - size.height > padding;
      const x = Math.min(
        Math.max(padding, anchor.left + anchor.width / 2 - size.width / 2),
        viewportWidth - size.width - padding,
      );
      const rawY = above ? anchor.top - gap - size.height : anchor.bottom + gap;
      const y = Math.max(
        padding,
        Math.min(rawY, viewportHeight - size.height - padding),
      );

      setCoords((prev) =>
        prev && prev.x === x && prev.y === y ? prev : { x, y, above },
      );
    };

    place();
    const raf = requestAnimationFrame(place);
    const observer = new ResizeObserver(place);
    if (panelRef.current) observer.observe(panelRef.current);
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", place);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      viewport?.removeEventListener("resize", place);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }
    const onPointerDown = (e: PointerEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      if (triggerRef.current?.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const onResize = () => setIsOpen(false);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [isOpen]);

  const drag = (
    element: HTMLElement | null,
    pointer: PointerEvent,
    handler: (sx: number, sy: number) => void,
  ) => {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    handler(
      clamp01((pointer.clientX - rect.left) / rect.width),
      clamp01((pointer.clientY - rect.top) / rect.height),
    );
  };

  const onSvPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag(svRef.current, e.nativeEvent, (sx, sy) =>
      commit({ h: hsv.h, s: sx, v: 1 - sy }),
    );
  };

  const onSvPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    drag(svRef.current, e.nativeEvent, (sx, sy) =>
      commit({ h: hsv.h, s: sx, v: 1 - sy }),
    );
  };

  const onHuePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag(hueRef.current, e.nativeEvent, (sx) =>
      commit({ h: sx * 359.999, s: hsv.s, v: hsv.v }),
    );
  };

  const onHuePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    drag(hueRef.current, e.nativeEvent, (sx) =>
      commit({ h: sx * 359.999, s: hsv.s, v: hsv.v }),
    );
  };

  const hueColor = hsvToHex(hsv.h, 1, 1);
  const hex = hsvToHex(hsv.h, hsv.s, hsv.v);

  const panel = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-label={`${label} picker`}
          initial={{ opacity: 0, scale: 0.94, y: 4 }}
          animate={{ opacity: coords ? 1 : 0, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={motionPreset.sheet}
          style={{
            position: "fixed",
            left: coords?.x ?? 0,
            top: coords?.y ?? 0,
            opacity: coords ? 1 : 0,
            pointerEvents: coords ? "auto" : "none",
            zIndex: 160,
          }}
          className="w-[248px] max-h-[calc(100dvh-20px)] overflow-y-auto scrollbar-ios
                     p-3.5 material-thick squircle rounded-card
                     flex flex-col gap-3 select-none"
        >
          <div
            ref={svRef}
            role="slider"
            aria-label="Saturation and brightness"
            aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
            aria-valuenow={Math.round(hsv.s * 100)}
            tabIndex={0}
            onPointerDown={onSvPointerDown}
            onPointerMove={onSvPointerMove}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 0.1 : 0.02;
              const map: Record<string, [number, number]> = {
                ArrowLeft: [-step, 0],
                ArrowRight: [step, 0],
                ArrowUp: [0, step],
                ArrowDown: [0, -step],
              };
              const delta = map[e.key];
              if (!delta) return;
              e.preventDefault();
              commit({
                h: hsv.h,
                s: clamp01(hsv.s + delta[0]),
                v: clamp01(hsv.v + delta[1]),
              });
            }}
            className="relative h-[132px] rounded-chip touch-none cursor-crosshair overflow-hidden
                       outline-none focus-visible:focus-ring"
            style={{
              backgroundColor: hueColor,
              backgroundImage:
                "linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0))",
            }}
          >
            <span
              aria-hidden
              className="absolute w-4 h-4 rounded-full border-2 border-white pointer-events-none"
              style={{
                left: `calc(${hsv.s * 100}% - 8px)`,
                top: `calc(${(1 - hsv.v) * 100}% - 8px)`,
                boxShadow:
                  "0 0 0 1px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.3)",
                backgroundColor: hex,
              }}
            />
          </div>

          <div
            ref={hueRef}
            role="slider"
            aria-label="Hue"
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round(hsv.h)}
            tabIndex={0}
            onPointerDown={onHuePointerDown}
            onPointerMove={onHuePointerMove}
            onKeyDown={(e) => {
              if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
              e.preventDefault();
              const delta = e.key === "ArrowRight" ? 4 : -4;
              commit({
                h: (hsv.h + delta + 360) % 360,
                s: hsv.s,
                v: hsv.v,
              });
            }}
            className="relative h-3 rounded-full touch-none cursor-pointer outline-none
                       focus-visible:focus-ring"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
            }}
          >
            <span
              aria-hidden
              className="absolute top-1/2 w-4 h-4 -mt-2 -ml-2 rounded-full border-2 border-white pointer-events-none"
              style={{
                left: `${(hsv.h / 360) * 100}%`,
                backgroundColor: hueColor,
                boxShadow:
                  "0 0 0 1px rgba(0,0,0,0.35), 0 2px 5px rgba(0,0,0,0.3)",
              }}
            />
          </div>

          {presets.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => {
                const active = preset.toLowerCase() === hex.toLowerCase();
                return (
                  <button
                    key={preset}
                    type="button"
                    aria-label={`Use ${preset}`}
                    aria-pressed={active}
                    onClick={() => commit(hexToHsv(preset))}
                    className="w-6 h-6 rounded-full transition-transform duration-100 active:scale-90"
                    style={{
                      backgroundColor: preset,
                      boxShadow: active
                        ? "0 0 0 2px var(--color-surface-elevated), 0 0 0 3.5px var(--color-text)"
                        : "inset 0 0 0 0.5px var(--material-hairline)",
                    }}
                  />
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="w-7 h-7 shrink-0 rounded-chip"
              style={{
                backgroundColor: hex,
                boxShadow: "inset 0 0 0 0.5px var(--material-hairline)",
              }}
            />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                if (isHex(draft)) {
                  const normalized = normalizeHex(draft);
                  setDraft(normalized);
                  commit(hexToHsv(normalized));
                } else {
                  setDraft(hex);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              spellCheck={false}
              autoComplete="off"
              aria-label="Hex colour"
              className="h-8 min-w-0 flex-1 rounded-chip px-2.5 bg-surface-secondary text-footnote
                         text-text font-mono uppercase tracking-wide tabular-nums
                         outline-none border border-transparent focus:border-border"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`${label}: ${value}`}
        title={`${label}: ${value}`}
        className={cn(
          "relative block shrink-0 rounded-chip p-0 transition-transform duration-150",
          "active:scale-95 outline-none focus-visible:focus-ring",
          "disabled:opacity-40 disabled:active:scale-100",
          className,
        )}
      >
        {trigger ?? (
          <span
            className="block w-7 h-7 rounded-chip"
            style={{
              backgroundColor: value,
              boxShadow: "inset 0 0 0 0.5px var(--material-hairline)",
            }}
          />
        )}
      </button>
      {createPortal(panel, document.body)}
    </>
  );
};

/** `abc` / `#abc` are accepted by the field; the model wants six digits. */
const normalizeHex = (value: string) => {
  const trimmed = value.trim().toLowerCase().replace("#", "");
  const expanded =
    trimmed.length === 3
      ? trimmed
          .split("")
          .map((c) => c + c)
          .join("")
      : trimmed;
  return `#${expanded}`;
};
