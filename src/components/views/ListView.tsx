import React from 'react';
import { AnimatePresence } from 'motion/react';
import { useStore } from '@/store/useStore';
import { selectActiveRank, selectCells } from '@/store/selectors';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { ListRow } from '@/components/ListRow';

export const ListView: React.FC = () => {
  const rank = useStore(selectActiveRank);
  const cells = useStore(selectCells);

  if (!rank) return null;

  return (
    <div
      className={`flex flex-col w-full max-w-5xl mx-auto px-4 sm:px-0 ${rank.style === 'card' ? 'gap-3' : 'divide-y divide-border'}`}
      style={rank.style === 'card' ? { gap: rank.gap ?? 8 } : {}}
    >
      <SortableContext items={cells.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <AnimatePresence mode="popLayout">
          {cells.map((cell, index) => (
            <ListRow
              key={cell.id}
              index={index}
              data={cell}
            />
          ))}
        </AnimatePresence>
      </SortableContext>
    </div>
  );
};