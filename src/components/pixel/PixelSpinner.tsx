import React from "react";
import { brandColorAt } from "@/constants/brand";

/** Clockwise order of a 3×3 grid, centre last. */
const RING = [0, 1, 2, 5, 8, 7, 6, 3, 4];

/**
 * A nine-cell pixel spinner.
 *
 * The app's busy state used to be `Loader2` turning at 1s/rev — a Lucide arc
 * with an anti-aliased edge, which is the one shape that cannot be made to look
 * like it belongs next to a bitmap wordmark. This is the same information in the
 * same visual language: nine hard squares, lit one at a time clockwise, each in
 * its own accent from the shared palette.
 *
 * The cycle is driven by `steps(1)` so every cell snaps on and off; nothing
 * fades, because a spinner that cross-fades reads as a gradient, and this app
 * does not have gradients.
 */
export const PixelSpinner: React.FC<{
  /** Edge length of one cell, in px. */
  cell?: number;
  className?: string;
  label?: string;
}> = ({ cell = 4, className = "", label = "Loading" }) => (
  <span
    role="status"
    aria-label={label}
    className={`grid grid-cols-3 place-items-center ${className}`}
    style={{ gap: Math.max(1, Math.round(cell / 2)), width: "max-content" }}
  >
    {Array.from({ length: 9 }, (_, index) => {
      const order = RING.indexOf(index);
      return (
        <span
          key={index}
          aria-hidden
          className="pixel-spin-cell block"
          style={{
            width: cell,
            height: cell,
            backgroundColor: brandColorAt(order),
            animationDelay: `${order * 90}ms`,
          }}
        />
      );
    })}
  </span>
);
