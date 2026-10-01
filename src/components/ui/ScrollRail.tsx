import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface ScrollRailProps {
  children: React.ReactNode;
  className?: string;
  scrollerClassName?: string;
  contentClassName?: string;
  /** Vertical alignment of the row within the rail. */
  align?: "start" | "center";
  /** Width of the trailing space that keeps the last item clear of the edge. */
  trailingSpace?: string;
}


/** How far the trailing/leading content fades into the surface, in px. */
const EDGE_FADE = 34;
export const ScrollRail: React.FC<ScrollRailProps> = ({
  children,
  className,
  scrollerClassName,
  contentClassName,
  align = "start",
  trailingSpace = "pr-10",
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const next = {
      start: scrollLeft > 8,
      end: scrollLeft < scrollWidth - clientWidth - 8,
    };
    setEdges((prev) =>
      prev.start === next.start && prev.end === next.end ? prev : next
    );
  }, []);

  useEffect(() => {
    measure();
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    Array.from(el.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
    // Re-measure whenever the content changes; the observed nodes may be new.
  }, [measure, children]);

  const stops = [
    edges.start ? `transparent 0, #000 ${EDGE_FADE}px` : `#000 0`,
    edges.end
      ? `#000 calc(100% - ${EDGE_FADE}px), transparent 100%`
      : `#000 100%`,
  ].join(", ");
  const edgeMask = `linear-gradient(to right, ${stops})`;

  const page = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" });
  };

  /* No `h-full` on the scroller by default: a rail inside a vertical scroller
     should be as tall as its content. Callers that need it to fill a flex parent
     pass `scrollerClassName="h-full"`. */
  return (
    <div className={`relative ${className ?? ""}`}>
      <div
        ref={scrollerRef}
        onScroll={measure}
        className={`w-full overflow-x-auto overflow-y-hidden overscroll-x-contain
                    scrollbar-none touch-pan-x ${scrollerClassName ?? ""}`}
        style={{
          // Only the edges that actually have content beyond them are masked, so
          // a rail that fits is not faded at all.
          maskImage: edgeMask,
          WebkitMaskImage: edgeMask,
        }}
      >
        <div
          className={`flex w-max gap-3 pl-1 ${trailingSpace} ${
            align === "center" ? "h-full items-center" : "items-start"
          } ${contentClassName ?? ""}`}
        >
          {children}
        </div>
      </div>

      {edges.start && (
        <RailChevron label="Scroll left" onClick={() => page(-1)}>
          <ChevronLeft size={18} strokeWidth={2.5} />
        </RailChevron>
      )}
      {edges.end && (
        <RailChevron label="Scroll right" onClick={() => page(1)}>
          <ChevronRight size={18} strokeWidth={2.5} />
        </RailChevron>
      )}
    </div>
  );
};

/** Floating paging button. Hidden on touch, where the swipe is the affordance. */
const RailChevron: React.FC<{
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, onClick, children }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className={`absolute top-1/2 -translate-y-1/2 z-20 hidden md:grid place-items-center w-9 h-9
                material rounded-full text-text hover:scale-105 active:scale-95
                transition-transform ease-spring animate-in fade-in duration-200
                ${label === "Scroll left" ? "left-2" : "right-2"}`}
  >
    {children}
  </button>
);
