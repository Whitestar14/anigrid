import React from "react";
import { Check, X } from "lucide-react";

interface AdjustOverlayProps {
  /**
   * `tile` is the big board tile with the full hint; `compact` is the small
   * thumbnail used by list rows and tier items.
   */
  variant?: "tile" | "compact";
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  onCancel: () => void;
  onSave: () => void;
}

const SURFACE: Record<
  "tile" | "compact",
  { box: string; hint: string; button: string; icon: number; gap: string }
> = {
  tile: {
    box: "z-20 flex-col justify-between p-2",
    hint: "px-2.5 py-1",
    button: "w-9 h-9",
    icon: 17,
    gap: "gap-2",
  },
  compact: {
    box: "z-30 flex-col items-center justify-between p-1",
    hint: "px-2 py-0.5",
    button: "w-6 h-6",
    icon: 12,
    gap: "gap-1",
  },
};

/**
 * The scrim that owns pan/pinch/zoom while an image is being repositioned.
 * `touch-none` is what lets the pointer handlers see touch moves at all.
 */
export const AdjustOverlay: React.FC<AdjustOverlayProps> = ({
  variant = "tile",
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onCancel,
  onSave,
}) => {
  const style = SURFACE[variant];

  return (
    <div
      className={`absolute inset-0 flex cursor-move select-none touch-none ${style.box}`}
      style={{ background: "rgba(0,0,0,0.45)" }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <span
        className={`media-scrim text-caption-2 font-semibold rounded-full ${style.hint}`}
      >
        {variant === "tile" ? "Drag to reposition · Scroll to zoom" : "Move"}
      </span>
      <div className={`flex ${style.gap} ${variant === "tile" ? "self-center" : ""}`}>
        <button
          type="button"
          aria-label="Cancel adjustments"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className={`flex items-center justify-center media-scrim rounded-full active:scale-90 transition-transform ${style.button}`}
        >
          <X size={style.icon} />
        </button>
        <button
          type="button"
          aria-label="Save adjustments"
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          className={`flex items-center justify-center rounded-full text-on-accent active:scale-90 transition-transform ${style.button}`}
          style={{ background: "var(--color-primary)" }}
        >
          <Check size={style.icon} />
        </button>
      </div>
    </div>
  );
};
