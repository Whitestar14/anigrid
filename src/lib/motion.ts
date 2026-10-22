import type { Transition } from "motion/react";

/**
 * The app's motion language.
 *
 *   snappy  press feedback and small state swaps — must feel instant
 *   control sliding indicators and text rolling through a fixed slot
 *   sheet   overlays: dialogs, popovers, menus, the rail
 *   enter   large content arriving; deliberately the softest
 *   scroll  following a gesture the user is already driving
 */
export const motion = {
  snappy: {
    type: "spring",
    stiffness: 520,
    damping: 32,
    mass: 0.6,
  },
  control: {
    type: "spring",
    stiffness: 500,
    damping: 38,
    mass: 0.6,
  },
  sheet: {
    type: "spring",
    stiffness: 460,
    damping: 34,
    mass: 0.7,
  },
  enter: {
    type: "spring",
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  },
  scroll: {
    type: "spring",
    stiffness: 180,
    damping: 30,
    mass: 0.4,
  },
} as const satisfies Record<string, Transition>;

/** The spring to use for `layout` / `layoutId` moves. */
export const layoutMotion = motion.control;

/**
 * Per-item delay for a staggered list entrance. Capped so a long list still
 * starts revealing itself promptly instead of trickling in over seconds.
 */
export function staggerDelay(index: number, step = 0.02, cap = 6) {
  return Math.min(index, cap) * step;
}

/** `staggerDelay` spread straight into a `transition`. */
export function stagger(index: number, step = 0.02, cap = 6) {
  return { ...motion.enter, delay: staggerDelay(index, step, cap) };
}
