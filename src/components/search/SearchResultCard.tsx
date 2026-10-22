import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { Check, Plus } from "lucide-react";
import { RemoteImage } from "@/components/ui/RemoteImage";
import type { MediaResult } from "@/core/metadata";

interface SearchResultCardProps {
  item: MediaResult;
  /** The same image is already on the board or in a collection. */
  isAdded: boolean;
  onAdd: (imageSrc: string) => void;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = React.memo(
  ({ item, isAdded, onAdd }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
      id: `search-${item.id}`,
      data: { type: "search-item", imageSrc: item.imageUrl },
    });

    return (
      <div className="flex flex-col gap-1.5 w-[92px] shrink-0">
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          title={item.title}
          className={`
          group/card relative aspect-[3/4] w-full overflow-hidden squircle cursor-grab
          material-card active:cursor-grabbing
          transition-transform duration-200 ease-spring
          ${isDragging ? "scale-95 opacity-50" : "hover:scale-[1.03]"}
        `}
          style={{
            borderRadius: "var(--radius-tile)",
            boxShadow: "inset 0 0 0 0.5px var(--material-hairline)",
          }}
        >
          <RemoteImage
            src={item.thumbnailUrl}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 w-full h-full ${
              isAdded ? "opacity-40 grayscale" : ""
            }`}
          />

          {/* Always visible. This was an `.affordance` revealed on `.tile:hover`
              — and a search result is not a `.tile`, so the control was
              permanently invisible on any device with a real pointer. */}
          <button
            type="button"
            aria-label={isAdded ? "Already in library" : `Add ${item.title}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!isAdded) onAdd(item.imageUrl);
            }}
            className={`absolute top-1.5 right-1.5 z-10 flex items-center justify-center w-[24px] h-[24px]
                      squircle transition-transform duration-150 touch-target
                      ${
                        isAdded
                          ? "bg-accent-green text-white"
                          : "material-thin text-text hover:scale-110 active:scale-95"
                      }`}
            style={{ borderRadius: 8 }}
          >
            {isAdded ? (
              <Check size={13} strokeWidth={3} />
            ) : (
              <Plus size={13} strokeWidth={3} />
            )}
          </button>
        </div>

        {/* `min-h` reserves the second line whether or not the title needs it,
            so the two rows of the grid are the same height. */}
        <span className="text-caption-1 leading-tight text-muted line-clamp-2 px-0.5 min-h-[2.1em]">
          {item.title}
        </span>
      </div>
    );
  }
);

SearchResultCard.displayName = "SearchResultCard";
