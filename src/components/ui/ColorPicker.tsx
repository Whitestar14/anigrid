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
import { PixelInput } from "@/components/pixel/PixelInput";

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const isHex = (value: string) =>
  /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());

/** `abc` / `#abc` → `#aabbcc`. The field accepts 3-digit; the model wants 6. */
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

const toCanonicalHex = (value: string) =>
  isHex(value) ? normalizeHex(value) : value;

export const COLOR_WHEEL =
  "conic-gradient(from 180deg, #ff6b6b, #ffd43b, #69db7c, #4dabf7, #9775fa, #ff6b6b)";

export const ColorWheelSwatch: React.FC<{
  value?: string;
  size?: number;
  active?: boolean;
  className?: string;
}> = ({ value, size = 28, active = false, className = "" }) => (
  <span
    aria-hidden
    className={`relative grid place-items-center rounded-full ${className}`}
    style={{
      width: size,
      height: size,
      backgroundImage: COLOR_WHEEL,
      boxShadow: active
        ? "0 0 0 2px var(--color-background), 0 0 0 3.5px var(--color-primary)"
        : "inset 0 0 0 0.5px var(--material-hairline)",
    }}
  >
    <span
      className="block rounded-full"
      style={{
        width: size - 7,
        height: size - 7,
        backgroundColor: value ?? "var(--color-surface-secondary)",
        boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.14)",
      }}
    />
  </span>
);

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

export interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  /** Visible swatch. Wrapped in a real button, so it must not be interactive itself. */
  trigger?: React.ReactNode;
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
  // Accept 3- or 6-digit hex from the consumer; use 6-digit internally.
  const normalizedValue = toCanonicalHex(value);

  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(normalizedValue);
  const [hsv, setHsv] = useState(() => hexToHsv(normalizedValue));
  const [coords, setCoords] = useState<{
    x: number;
    y: number;
    above: boolean;
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  /* rAF-throttle onChange so a drag doesn't hammer the consumer. Local
     visual state (hsv / draft) still updates synchronously every event. */
  const changeRafRef = useRef<number | null>(null);
  const pendingHexRef = useRef<string | null>(null);

  const scheduleChange = useCallback(
    (hex: string) => {
      pendingHexRef.current = hex;
      if (changeRafRef.current != null) return;
      changeRafRef.current = requestAnimationFrame(() => {
        changeRafRef.current = null;
        const pending = pendingHexRef.current;
        pendingHexRef.current = null;
        if (pending != null) onChange(pending);
      });
    },
    [onChange],
  );

  useEffect(
    () => () => {
      if (changeRafRef.current != null) {
        cancelAnimationFrame(changeRafRef.current);
        changeRafRef.current = null;
      }
    },
    [],
  );

  /* Re-sync when the value changes from outside. */
  useEffect(() => {
    setDraft(normalizedValue);
    setHsv((prev) =>
      hsvToHex(prev.h, prev.s, prev.v) === normalizedValue.toLowerCase()
        ? prev
        : hexToHsv(normalizedValue),
    );
  }, [normalizedValue]);

  /* Close when the trigger becomes disabled while open. */
  useEffect(() => {
    if (disabled) setIsOpen(false);
  }, [disabled]);

  const commit = useCallback(
    (next: { h: number; s: number; v: number }) => {
      setHsv(next);
      const hex = hsvToHex(next.h, next.s, next.v);
      setDraft(hex);
      scheduleChange(hex);
    },
    [scheduleChange],
  );

  /* Placement. `offsetWidth/Height` ignore the entrance scale transform,
     so measurements are accurate on the first frame. */
  useLayoutEffect(() => {
    if (!isOpen) return;
    const triggerEl = triggerRef.current;
    const panelEl = panelRef.current;
    if (!triggerEl || !panelEl) return;

    const place = () => {
      const anchor = triggerEl.getBoundingClientRect();
      const width = panelEl.offsetWidth;
      const height = panelEl.offsetHeight;
      const padding = 10;
      const gap = 8;
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight;
      const viewportWidth = window.visualViewport?.width ?? window.innerWidth;

      // Trigger scrolled fully out of view — close instead of chasing it.
      if (anchor.bottom < 0 || anchor.top > viewportHeight) {
        setIsOpen(false);
        return;
      }

      const above =
        anchor.bottom + gap + height > viewportHeight - padding &&
        anchor.top - gap - height > padding;
      const x = Math.min(
        Math.max(padding, anchor.left + anchor.width / 2 - width / 2),
        viewportWidth - width - padding,
      );
      const rawY = above ? anchor.top - gap - height : anchor.bottom + gap;
      const y = Math.max(
        padding,
        Math.min(rawY, viewportHeight - height - padding),
      );

      setCoords((prev) =>
        prev && prev.x === x && prev.y === y && prev.above === above
          ? prev
          : { x, y, above },
      );
    };

    // Synchronous first measure — runs before paint, no flash.
    place();

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        place();
      });
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(panelEl);
    observer.observe(triggerEl);

    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [isOpen]);

  /* Outside click + Escape. */
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      if (triggerRef.current?.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
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

  const hueFromPointer = (
    element: HTMLElement | null,
    pointer: PointerEvent,
  ) => {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const dx = pointer.clientX - (rect.left + rect.width / 2);
    const dy = pointer.clientY - (rect.top + rect.height / 2);
    return (Math.atan2(dx, -dy) * 180) / Math.PI;
  };

  const onHuePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const h = hueFromPointer(hueRef.current, e.nativeEvent);
    if (h !== null) commit({ h: ((h % 360) + 360) % 360, s: hsv.s, v: hsv.v });
  };

  const onHuePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const h = hueFromPointer(hueRef.current, e.nativeEvent);
    if (h !== null) commit({ h: ((h % 360) + 360) % 360, s: hsv.s, v: hsv.v });
  };

  const hueColor = hsvToHex(hsv.h, 1, 1);
  const hex = hsvToHex(hsv.h, hsv.s, hsv.v);

  const panel = (
    <AnimatePresence onExitComplete={() => setCoords(null)}>
      {isOpen && (
        <motion.div
          key="panel"
          ref={panelRef}
          role="dialog"
          aria-label={`${label} picker`}
          initial={{ opacity: 0, scale: 0.94, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={motionPreset.sheet}
          style={{
            position: "fixed",
            left: coords?.x ?? 0,
            top: coords?.y ?? 0,
            pointerEvents: isOpen ? "auto" : "none",
            zIndex: 160,
            transformOrigin: coords?.above ? "bottom center" : "top center",
          }}
          className="w-[248px] max-h-[calc(100dvh-20px)] overflow-y-auto scrollbar-ios
                     p-3.5 material-thick squircle rounded-card
                     flex flex-col gap-3 select-none"
        >
          <div
            ref={svRef}
            role="slider"
            aria-label="Saturation and brightness"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(hsv.s * 100)}
            aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
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

          <div className="flex items-center gap-3">
            <div
              ref={hueRef}
              role="slider"
              aria-label="Hue"
              aria-valuemin={0}
              aria-valuemax={360}
              aria-valuenow={Math.round(hsv.h)}
              aria-valuetext={`${Math.round(hsv.h)}°`}
              tabIndex={0}
              onPointerDown={onHuePointerDown}
              onPointerMove={onHuePointerMove}
              onKeyDown={(e) => {
                const step = e.shiftKey ? 10 : 4;
                const delta =
                  e.key === "ArrowRight" || e.key === "ArrowUp"
                    ? step
                    : e.key === "ArrowLeft" || e.key === "ArrowDown"
                      ? -step
                      : 0;
                if (!delta) return;
                e.preventDefault();
                commit({
                  h: (hsv.h + delta + 360) % 360,
                  s: hsv.s,
                  v: hsv.v,
                });
              }}
              className="relative w-11 h-11 shrink-0 rounded-full touch-none cursor-crosshair
                         outline-none focus-visible:focus-ring"
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  backgroundImage:
                    "conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                  maskImage:
                    "radial-gradient(circle, transparent 15.5px, #000 16.5px)",
                  WebkitMaskImage:
                    "radial-gradient(circle, transparent 15.5px, #000 16.5px)",
                }}
              />
              <span
                aria-hidden
                className="absolute left-1/2 top-1/2 w-[18px] h-[18px] -ml-[9px] -mt-[9px]
                           rounded-full pointer-events-none"
                style={{
                  backgroundColor: hex,
                  boxShadow:
                    "inset 0 0 0 0.5px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.12)",
                }}
              />
              <span
                aria-hidden
                className="absolute left-1/2 top-1/2 w-[7px] h-[7px] -ml-[3.5px] -mt-[3.5px]
                           rounded-full bg-white pointer-events-none"
                style={{
                  transform: `rotate(${hsv.h}deg) translateY(-19px)`,
                  boxShadow: "0 0 0 1.5px rgba(0,0,0,0.4)",
                }}
              />
            </div>

            <PixelInput
              value={draft}
              label="Hex colour"
              height={14}
              onChange={setDraft}
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
              className="min-w-0 flex-1"
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
              backgroundColor: normalizedValue,
              boxShadow: "inset 0 0 0 0.5px var(--material-hairline)",
            }}
          />
        )}
      </button>
      {createPortal(panel, document.body)}
    </>
  );
};
