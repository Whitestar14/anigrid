import React from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useStore } from "@/store/useStore";
import { selectActiveRank, selectCells } from "@/store/selectors";
import { ListRow } from "@/components/ListRow";

export const ListView = React.memo(function ListView() {
  const rank = useStore(selectActiveRank);
  const cells = useStore(selectCells);

  if (!rank) return null;

  const isCard = rank.style === "card";

  return (
    <div data-export-board="" className="flex flex-col w-full max-w-3xl mx-auto">
      <SortableContext
        items={cells.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={
            isCard
              ? "flex flex-col"
              : "flex flex-col rounded-panel overflow-hidden border border-border squircle"
          }
          style={isCard ? { gap: rank.gap || 8 } : undefined}
        >
          {cells.map((cell, index) => (
            <ListRow key={cell.id} index={index} data={cell} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
});
