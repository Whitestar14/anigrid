import React, { useCallback, useMemo, useRef, useState } from "react";
import { useStore } from "@/store/useStore";
import { selectActiveRank, selectCells } from "@/store/selectors";
import { Cell } from "@/components/Cell";

export const GridView = React.memo(function GridView() {
  const rank = useStore(selectActiveRank);
  const cells = useStore(selectCells);
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(0);

  const cols = rank?.config.cols ?? 3;
  const count = cells.length;
  // The gutter is fully user-controlled; the Card style seeds a sensible one
  // when it is selected so a switched board does not look like a collage.
  const gap = rank?.gap ?? 0;

  const boardStyle = useMemo<React.CSSProperties>(() => {
    const tile = rank?.cellWidth ?? 240;
    return {
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gap: `${gap}px`,
      width: `${cols * tile + (cols - 1) * gap}px`,
      // Never wider than the space actually available.
      maxWidth: "100%",
    };
  }, [cols, gap, rank?.cellWidth]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-cell-index]"
      );
      if (!el) return;
      const i = Number(el.dataset.cellIndex);
      let next: number | null = null;

      switch (e.key) {
        case "ArrowRight":
          next = Math.min(i + 1, count - 1);
          break;
        case "ArrowLeft":
          next = Math.max(i - 1, 0);
          break;
        case "ArrowDown":
          next = Math.min(i + cols, count - 1);
          break;
        case "ArrowUp":
          next = Math.max(i - cols, 0);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = count - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      setFocusIndex(next);
      containerRef.current
        ?.querySelector<HTMLElement>(`[data-cell-index="${next}"]`)
        ?.focus();
    },
    [cols, count]
  );

  if (!rank) return null;

  return (
    <div
      ref={containerRef}
      role="grid"
      data-export-board=""
      aria-label={`${rank.title} ranking board`}
      aria-rowcount={Math.ceil(count / cols)}
      aria-colcount={cols}
      onKeyDown={handleKeyDown}
      className="grid w-full mx-auto"
      style={boardStyle}
    >
      {cells.map((cell, index) => (
        <Cell
          key={cell.id}
          index={index}
          cols={cols}
          count={count}
          tabbable={index === Math.min(focusIndex, count - 1)}
          onFocusTile={setFocusIndex}
        />
      ))}
    </div>
  );
});
