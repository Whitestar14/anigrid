import React from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/utils";
import { motion as motionPreset } from "@/lib/motion";

/**
 * Deliberately narrower than `HTMLMotionProps<"button">`: motion redefines the
 * drag handlers (`onDrag`, `onPanStart`, …) to take gesture info, which
 * conflicts with the DOM signatures any component built on plain button props
 * is already passing down.
 */
export interface PressableProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "ref" | "children"
  > {
  children?: React.ReactNode;
  /**
   * How far the control compresses on press. Defaults to a subtle 3%; pass a
   * larger value for large, isolated targets like a tile or a dock card.
   */
  scale?: number;
}

/**
 * The app's press feedback, in one place.
 *
 * Previously the toolbar used a spring while `Button` used `active:opacity` and
 * the settings rows used neither, so pressing things felt uneven in a way that
 * is hard to point at but easy to feel. Everything now compresses on the same
 * spring at the same magnitude.
 */
export const Pressable = React.forwardRef<HTMLButtonElement, PressableProps>(
  ({ children, className, scale = 0.97, disabled, ...props }, ref) => (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      whileTap={disabled ? undefined : { scale }}
      transition={motionPreset.snappy}
      className={cn(
        "outline-none focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-40",
        className
      )}
      /* Motion redefines around fifteen handler names for its gesture system
         (`onDrag`, `onPanStart`, `onAnimationStart`, `onPointerDown`, …), each
         with a different signature from the DOM one. Since callers pass plain
         DOM button props, the two types can never line up structurally — so
         this is reconciled once here rather than by enumerating every
         conflicting name at every call site. Nothing in the app passes a
         motion-specific handler through this component. */
      {...(props as unknown as HTMLMotionProps<"button">)}
    >
      {children}
    </motion.button>
  )
);

Pressable.displayName = "Pressable";