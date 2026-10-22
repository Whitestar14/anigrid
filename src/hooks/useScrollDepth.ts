import { useEffect, useRef, useState, type RefObject } from "react";
import { useMotionValue, useSpring, type MotionValue } from "motion/react";
import { motion as motionPreset } from "@/lib/motion";

export interface ScrollDepth {
  /** Spring-smoothed scroll progress: 0 at the top, 1 once fully scrolled. */
  depth: MotionValue<number>;
  /** A plain boolean for affordances that are not animated, such as a hairline. */
  isScrolled: boolean;
}

/**
 * Turns a scroller's offset into a smooth 0–1 signal.
 *
 * The raw scroll position is driven directly by a finger or a wheel, so it is
 * noisy and updates outside React's render cycle. Reading it into state and
 * animating from there produces visible jitter; the raw value feeds a spring,
 * and only the boolean is React state.
 */
export function useScrollDepth<T extends HTMLElement>(): {
  ref: RefObject<T | null>;
  isScrolled: boolean;
  depth: MotionValue<number>;
} {
  const ref = useRef<T>(null);
  const raw = useMotionValue(0);
  const depth = useSpring(raw, motionPreset.scroll);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const read = () => {
      const max = el.scrollHeight - el.clientHeight;
      raw.set(max > 0 ? Math.min(1, el.scrollTop / max) : 0);
    };

    read();
    el.addEventListener("scroll", read, { passive: true });

    const observer = new ResizeObserver(read);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);

    return () => {
      el.removeEventListener("scroll", read);
      observer.disconnect();
    };
  }, []);

  // `prefers-reduced-motion` collapses the spring to an instant jump, so this
  // only needs to track whether the value has crossed out of the resting zone.
  useEffect(() => {
    const unsubscribe = depth.on("change", (v) => {
      setIsScrolled((was) => {
        const next = v > 0.002;
        return was === next ? was : next;
      });
    });
    return unsubscribe;
  }, [depth]);

  return { ref, isScrolled, depth };
}