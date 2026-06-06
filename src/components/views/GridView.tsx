import React from 'react';
import { CellData } from '@/types';
import { Cell } from '@/components/Cell';
import { motion } from 'motion/react';
import { useStore } from '@/store/useStore';
import { selectActiveRank, selectCells } from '@/store/selectors';

export const GridView = React.memo(() => {
    const rank = useStore(selectActiveRank);
    const cells = useStore(selectCells);

    if (!rank) return null;

    const cols = rank.config.cols;


    const justifyClass = rank.gridJustify === 'left' ? 'justify-start' : 
                         rank.gridJustify === 'right' ? 'justify-end' : 
                         'justify-center';

    return (
        <motion.div
            className={`grid ${justifyClass} mx-auto`}
            animate={{
                gridTemplateColumns: `repeat(${cols}, ${rank.cellWidth ? `${rank.cellWidth}px` : `minmax(120px, 1fr)`})`,
                gap: `${rank.gap ?? 0}px`,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            {cells.map((cell, index) => (
                <Cell
                    key={cell.id}
                    index={index}
                />
            ))}
        </motion.div>
    );
});
