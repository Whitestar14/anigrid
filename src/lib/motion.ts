import type { Transition } from "motion/react";

/**
 * The app's motion language.
 *
 * These four presets replaced ~22 hand-written springs that had drifted apart
 * — stiffness ranging 340 to 560 — which made some controls snap while others
 * glided. The eye reads that inconsistency as cheap even when no individual
 * animation is wrong.
 *
 * Each value is the dominant one already in use for that *kind* of movement,
 * so adopting these is a consolidation rather than a redesign:
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
  /* Not for taps. This smooths a value the user is actively driving — a
     scroll offset — so it is slow and heavily damped, with no overshoot to
     make the content feel like it is fighting the input. */
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