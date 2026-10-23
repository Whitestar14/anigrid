import React from "react";
import { PixelIcon } from "@/components/pixel/PixelIcon";

interface TileEmptyStateProps {
  index: number;
  /** True while any card is in flight, which pre-highlights every empty tile. */
  isDraggingAny: boolean;
  labelColor?: string;
  onOpen: (e: React.MouseEvent) => void;
}

/** The "Add" affordance that fills an empty position. */
export const TileEmptyState: React.FC<TileEmptyStateProps> = ({
  index,
  isDraggingAny,
  labelColor,
  onOpen,
}) => (
  <button
    type="button"
    data-export-hide=""
    aria-label={`Add image to position ${index + 1}`}
    onClick={onOpen}
    className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-1.5
               card-veil hover:bg-hover transition-colors duration-150
               text-muted cursor-pointer"
  >
    <span
      className={`flex items-center justify-center rounded-full media-scrim
                  w-[19cqi] h-[19cqi] min-w-8 min-h-8 max-w-14 max-h-14
                  transition-transform duration-200 ease-spring ${
                    isDraggingAny ? "scale-110" : "group-hover/tile:scale-105"
                  }`}
      style={
        isDraggingAny
          ? {
              boxShadow:
                "0 0 0 1.5px var(--color-primary), inset 0 0 0 0.5px rgba(255,255,255,0.2)",
              color: "var(--color-primary)",
            }
          : undefined
      }
    >
      <PixelIcon name="plus" size={18} className="w-[46%] h-[46%]" />
    </span>
    <span
      className="text-caption-1 font-medium opacity-80 transition-opacity duration-150
                 group-hover/tile:opacity-100"
      style={labelColor ? { color: labelColor } : undefined}
    >
      Add
    </span>
  </button>
);
