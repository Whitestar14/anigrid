import React from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store/useStore";
import { selectCells } from "@/store/selectors";
import { ListRow } from "@/components/ListRow";
import { selectActiveBoard } from "@/utils/boardStyle";

export const ListView = React.memo(function ListView() {
  const board = useStore(useShallow(selectActiveBoard));
  const cells = useStore(selectCells);

  if (!board) return null;

  return (
    <div data-export-board="" className="flex flex-col w-full">
      <SortableContext
        items={cells.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={
            board.isCard
              ? "flex flex-col"
              : `flex flex-col rounded-panel overflow-hidden squircle ${
                  board.borderless ? "" : "border border-border"
                }`
          }
          style={board.isCard ? { gap: board.gap } : undefined}
        >
          {cells.map((cell, index) => (
            <ListRow key={cell.id} index={index} data={cell} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
});
