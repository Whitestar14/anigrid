import { useCallback, useEffect, useRef } from "react";
import { useMotionValue, type MotionValue } from "motion/react";

/** Horizontal reach of the magnification, in px, measured from the pointer. */
export const MAG_REACH = 88;
/** Peak growth for the item directly under the pointer. */
export const MAG_MAX_SCALE = 0.18;
/** How hard neighbours are shoved aside, as a fraction of their offset. */
export const MAG_PUSH = 0.16;

/** Marks an element the row measures the centres of. */
export const MAG_ITEM_ATTR = "data-mag-item";

export interface MagnificationContext {
  rowRef: React.RefObject<HTMLDivElement | null>;
  /** Pointer position in row-local coordinates. */
  pointerX: MotionValue<number>;
  /** 0 when the pointer has left the row, so everything settles. */
  engaged: MotionValue<number>;
  /** Current centre of each magnified item, in row-local coordinates. */
  centers: React.RefObject<number[]>;
  handlers: {
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerLeave: () => void;
  };
}

/**
 * Pointer-proximity magnification for a row of discrete items.
 *
 * The item under the pointer grows and its neighbours slide aside, so the row
 * behaves like a dock rather than a list of buttons. Both effects are driven
 * from a single `MotionValue`, so sweeping the pointer never re-renders React.
 *
 * The component that consumes this lives in `MagnifyItem.tsx`; keeping the two
 * apart is what lets the hook module stay fast-refresh friendly.
 */
export function useMagnificationRow(): MagnificationContext {
  const rowRef = useRef<HTMLDivElement>(null);
  const centers = useRef<number[]>([]);
  const measureRef = useRef<() => void>(() => {});
  const pointerX = useMotionValue(-9999);
  const engaged = useMotionValue(0);

  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    const base = row.getBoundingClientRect();
    centers.current = Array.from(
      row.querySelectorAll<HTMLElement>(`[${MAG_ITEM_ATTR}]`)
    ).map((el) => {
      const r = el.getBoundingClientRect();
      return r.left + r.width / 2 - base.left;
    });
  }, []);

  /*
   * Centres must be re-read whenever the row reflows: chips are renamed inline,
   * items are added or removed, and the row scrolls horizontally.
   *
   * Each magnified item is observed individually rather than the row alone,
   * because the row is `w-full` — its own box never changes size when a chip is
   * added, so observing only the row left the cached centres stale and the
   * pointer magnified whichever chip used to sit at the remembered offset.
   */
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const observer = new ResizeObserver(measure);
    const observeItems = () => {
      observer.disconnect();
      observer.observe(row);
      for (const el of Array.from(
        row.querySelectorAll<HTMLElement>(`[${MAG_ITEM_ATTR}]`)
      )) {
        observer.observe(el);
      }
    };

    observeItems();
    measure();

    const mutation = new MutationObserver(() => {
      observeItems();
      measure();
    });
    mutation.observe(row, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    row.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      mutation.disconnect();
      row.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  measureRef.current = measure;

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const row = (e.currentTarget as HTMLElement).getBoundingClientRect();
      // Re-measure on the way in. Both observers can be a frame late, and a
      // stale centre means the wrong chip grows under the pointer — which is
      // worse than no magnification at all.
      measureRef.current?.();
      pointerX.set(e.clientX - row.left);
      engaged.set(1);
    },
    [pointerX, engaged]
  );

  const onPointerLeave = useCallback(() => engaged.set(0), [engaged]);

  return { rowRef, pointerX, engaged, centers, handlers: { onPointerMove, onPointerLeave } };
}