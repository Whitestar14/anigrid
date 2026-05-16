import React from 'react';
import { CellData, TierData } from '@/types';
import { Cell } from '@/components/Cell';
import { Palette } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '@/store/useStore';
import { selectActiveRank, selectCells } from '@/store/selectors';

const TIER_PRESETS = [
    { label: 'S', color: '#ff7f7f' },
    { label: 'A', color: '#ffbf7f' },
    { label: 'B', color: '#ffdf7f' },
    { label: 'C', color: '#ffff7f' },
    { label: 'D', color: '#bfff7f' },
    { label: 'E', color: '#7fff7f' },
    { label: 'F', color: '#7fffff' },
];

const TierHeader = React.memo<{
    index: number;
    data?: TierData;
    onUpdate: (data: TierData) => void
}>(({ index, data, onUpdate }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const label = data?.label || TIER_PRESETS[Math.min(index, TIER_PRESETS.length - 1)].label;
    const color = data?.color || TIER_PRESETS[Math.min(index, TIER_PRESETS.length - 1)].color;
    const [tempLabel, setTempLabel] = React.useState(label);

    const handleColorCycle = (e: React.MouseEvent) => {
        e.stopPropagation();
        const currIdx = TIER_PRESETS.findIndex(p => p.color === color);
        const nextIdx = (currIdx + 1) % TIER_PRESETS.length;
        onUpdate({ label, color: TIER_PRESETS[nextIdx].color });
    };

    return (
        <div
            className="flex items-center justify-center shrink-0 w-24 sm:w-32 rounded-xl outline outline-black/10 shadow-sm relative group overflow-hidden transition-all hover:shadow-md"
            style={{ backgroundColor: color }}
            onClick={() => setIsEditing(true)}
        >
            {isEditing ? (
                <textarea
                    autoFocus
                    value={tempLabel}
                    onChange={(e) => setTempLabel(e.target.value)}
                    onBlur={() => {
                        setIsEditing(false);
                        onUpdate({ label: tempLabel, color });
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            e.currentTarget.blur();
                        }
                    }}
                    className="w-full h-full bg-transparent text-center text-black/90 font-black font-sans text-2xl resize-none outline-none p-2 flex items-center justify-center placeholder:text-black/30"
                    style={{ lineHeight: '1.1' }}
                />
            ) : (
                <span className="text-2xl sm:text-3xl font-black text-black/80 drop-shadow-sm text-center px-2 break-words leading-tight select-none">
                    {label}
                </span>
            )}
            <button
                onClick={handleColorCycle}
                className="absolute bottom-1 right-1 p-1.5 bg-white/40 hover:bg-white/80 rounded-full text-black/60 hover:text-black opacity-0 group-hover:opacity-100 transition-all export-hidden"
                title="Cycle Color"
            >
                <Palette size={14} />
            </button>
        </div>
    );
});

export const GridView = React.memo(() => {
    const rank = useStore(selectActiveRank);
    const cells = useStore(selectCells);
    const interactionState = useStore(s => s.interactionState);
    const [triggerPoint, setTriggerPoint] = React.useState<{ x: number; y: number } | null>(null);

    // Actions
    const handleCellUpload = useStore(s => s.handleCellUpload);
    const handleCellClear = useStore(s => s.handleCellClear);
    const handleSwapCells = useStore(s => s.handleSwapCells);
    const handleInboxDrop = useStore(s => s.handleInboxDrop);
    const handleInboxDropMulti = useStore(s => s.handleInboxDropMulti);
    const handleSearchDrop = useStore(s => s.handleSearchDrop);
    const handleUpdateCell = useStore(s => s.handleUpdateCell);
    const handleMoveToInbox = useStore(s => s.handleMoveToInbox);
    const setInteractionState = useStore(s => s.setInteractionState);
    const onInteract = React.useCallback((index: number, point?: { x: number; y: number } | null) => {
        const current = useStore.getState().interactionState;
        
        if (index === -1) {
            setInteractionState(null);
            setTriggerPoint(null);
            return;
        }

        // Cell -> Cell Swap
        if (current?.type === 'cell') {
            if (current.index !== index) {
                handleSwapCells(current.index, index);
                setInteractionState(null);
                setTriggerPoint(null);
            } else {
                setInteractionState(null);
                setTriggerPoint(null);
            }
            return;
        }

        // Inbox -> Cell Drop
        if (current?.type === 'inbox') {
            handleInboxDrop(current.itemId, current.collectionId, index);
            setInteractionState(null);
            setTriggerPoint(null);
            return;
        }

        // Multi-Inbox -> Cell Drop
        if (current?.type === 'inbox-multi') {
            handleInboxDropMulti(current.itemIds, current.collectionId, index);
            setInteractionState(null);
            setTriggerPoint(null);
            return;
        }

        // Search -> Cell Drop
        if (current?.type === 'search') {
            handleSearchDrop(current.imageSrc, index);
            setInteractionState(null);
            setTriggerPoint(null);
            return;
        }

        setInteractionState({ type: 'cell', index });
        if (point) setTriggerPoint(point);
    }, [setInteractionState, handleSwapCells, handleInboxDrop, handleSearchDrop, handleInboxDropMulti]);

    if (!rank) return null;

    const cols = rank.config.cols;
    const showTiers = rank.showTiers;

    // Chunk cells into rows for Tier View
    const rows = [];
    if (showTiers) {
        for (let i = 0; i < cells.length; i += cols) {
            rows.push(cells.slice(i, i + cols));
        }
    }

    if (showTiers) {
        return (
            <div className="flex flex-col" style={{ gap: `${rank.gap ?? 0}px` }}>
                {rows.map((rowCells, rowIndex) => (
                    <motion.div layout key={rowIndex} className="flex" style={{ gap: `${rank.gap ?? 0}px` }}>
                        <TierHeader
                            index={rowIndex}
                            data={rank.tierRows?.[rowIndex]}
                            onUpdate={(d) => {
                                const newRows = [...(rank.tierRows || [])];
                                newRows[rowIndex] = { ...newRows[rowIndex], ...d };
                                useStore.getState().handleUpdateTierRows(newRows);
                            }}
                        />
                        <motion.div
                            layout
                            className="grid justify-center mx-auto"
                            animate={{
                                gridTemplateColumns: `repeat(${cols}, ${rank.cellWidth ? `${rank.cellWidth}px` : `minmax(120px, 1fr)`})`,
                                gap: `${rank.gap ?? 0}px`,
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                            {rowCells.map((cell) => {
                                const globalIndex = cells.indexOf(cell);
                                return (
                                    <Cell
                                        key={cell.id}
                                        index={globalIndex}
                                        styleMode={rank.style}
                                        showRankNumber={rank.showNumbers ?? true}
                                        isSelected={interactionState?.type === 'cell' && interactionState.index === globalIndex}
                                        onUpload={(idx, file) => {
                                            const reader = new FileReader();
                                            reader.onload = (e) => {
                                                if (e.target?.result) {
                                                    handleCellUpload(idx, e.target.result as string);
                                                }
                                            };
                                            reader.readAsDataURL(file);
                                        }}
                                        onClear={handleCellClear}
                                        onSwap={handleSwapCells}
                                        onInboxDrop={handleInboxDrop}
                                        onSearchDrop={handleSearchDrop}
                                        onDownloadSingle={() => { }}
                                        onInteract={onInteract}
                                        onUpdateCell={handleUpdateCell}
                                        onMoveToInbox={handleMoveToInbox}
                                        borderless={rank.borderless}
                                        aspectRatio={rank.aspectRatio}
                                    />
                                );
                            })}
                        </motion.div>
                    </motion.div>
                ))}
            </div>
        );
    }

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
                    styleMode={rank.style}
                    showRankNumber={rank.showNumbers ?? true}
                    isSelected={interactionState?.type === 'cell' && interactionState.index === index}
                    onUpload={(idx, file) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            if (e.target?.result) {
                                handleCellUpload(idx, e.target.result as string);
                            }
                        };
                        reader.readAsDataURL(file);
                    }}
                    onClear={handleCellClear}
                    onSwap={handleSwapCells}
                    onInboxDrop={handleInboxDrop}
                    onInboxDropMulti={handleInboxDropMulti}
                    onSearchDrop={handleSearchDrop}
                    onDownloadSingle={() => { }}
                    onInteract={onInteract}
                    onUpdateCell={handleUpdateCell}
                    onMoveToInbox={handleMoveToInbox}
                    borderless={rank.borderless}
                    aspectRatio={rank.aspectRatio}
                />
            ))}
        </motion.div>
    );
});
