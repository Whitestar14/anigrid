import React from "react";
import { MotionConfig } from "motion/react";

/**
 * `a11y.css` collapses CSS animation and transition durations when the user
 * prefers reduced motion — but nearly every animation in this app is a JS
 * spring, which that stylesheet cannot reach. Without this, the setting
 * appeared to do nothing for the parts of the interface that move most.
 */
export const MotionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <MotionConfig reducedMotion="user">{children}</MotionConfig>;