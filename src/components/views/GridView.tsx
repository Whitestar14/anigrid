import React, { useState } from 'react';
import { Rank, CellData, InteractionState, TierData } from '@/types';
import { Cell } from '@/components/Cell';
import { Palette } from 'lucide-react';

interface GridViewProps {
  rank: Rank;
  onUpload: (index: number, file: File) => void;
  onClear: (index: number) => void;
  onSwap: (fromIndex: number, toIndex: number) => void;
  onInboxDrop: (itemId: string, collectionId: string, toIndex: number) => void;
  onInboxDropMulti: (itemIds: string[], collectionId: string, toIndex: number) => void;
  onSearchDrop: (imageSrc: string, toIndex: number) => void;
  onDownloadSingle: (index: number) => void;
  // Interaction
  interactionState: InteractionState;
  onInteract: (index: number) => void;
  onUpdateCell: (index: number, data: Partial<CellData>) => void;
  onUpdateTier?: (rowIndex: number, data: TierData) => void;
}

const TIER_PRESETS = [
    { label: 'S', color: '#ff7f7f' }, // Red
    { label: 'A', color: '#ffbf7f' }, // Orange
    { label: 'B', color: '#ffdf7f' }, // Yellow
    { label: 'C', color: '#ffff7f' }, // Light Yellow
    { label: 'D', color: '#bfff7f' }, // Greenish
    { label: 'E', color: '#7fff7f' }, // Green
    { label: 'F', color: '#7fffff' }, // Blue
];

const TierHeader: React.FC<{
    index: number;
    data?: TierData;
    onUpdate: (data: TierData) => void
}> = ({ index, data, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);

    // Default values if no data exists yet
    const label = data?.label || TIER_PRESETS[Math.min(index, TIER_PRESETS.length - 1)].label;
    const color = data?.color || TIER_PRESETS[Math.min(index, TIER_PRESETS.length - 1)].color;

    const [tempLabel, setTempLabel] = useState(label);

    const handleColorCycle = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Find current color index
        const currIdx = TIER_PRESETS.findIndex(p => p.color === color);
        const nextIdx = (currIdx + 1) % TIER_PRESETS.length;
        onUpdate({ label, color: TIER_PRESETS[nextIdx].color });
    };

    return (
        <div
            className="flex items-center justify-center shrink-0 w-24 sm:w-32 rounded-xl border border-black/10 shadow-sm relative group overflow-hidden transition-all hover:shadow-md"
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

            {/* Color Cycle Button (Hidden until hover) */}
            <button
                onClick={handleColorCycle}
                className="absolute bottom-1 right-1 p-1.5 bg-white/40 hover:bg-white/80 rounded-full text-black/60 hover:text-black opacity-0 group-hover:opacity-100 transition-all export-hidden"
                title="Cycle Color"
            >
                <Palette size={14} />
            </button>
        </div>
    );
};

export const GridView: React.FC<GridViewProps> = ({
  rank,
  onUpload,
  onClear,
  onSwap,
  onInboxDrop,
  onInboxDropMulti,
  onSearchDrop,
  onDownloadSingle,
  interactionState,
  onInteract,
  onUpdateCell,
  onUpdateTier
}) => {
  const cols = rank.config.cols;
  const showTiers = rank.showTiers;

  // Chunk cells into rows for Tier View
  const rows = [];
  if (showTiers) {
      for (let i = 0; i < rank.cells.length; i += cols) {
          rows.push(rank.cells.slice(i, i + cols));
      }
  }

  if (showTiers) {
      return (
          <div className="flex flex-col" style={{ gap: `${rank.gap ?? 0}px` }}>
              {rows.map((rowCells, rowIndex) => (
                  <div key={rowIndex} className="flex" style={{ gap: `${rank.gap ?? 0}px` }}>
                      {/* Tier Header */}
                      <TierHeader
                        index={rowIndex}
                        data={rank.tiers?.[rowIndex]}
                        onUpdate={(d) => onUpdateTier && onUpdateTier(rowIndex, d)}
                      />

                      {/* Grid Row */}
                      <div
                        className="grid"
                        style={{
                            gridTemplateColumns: `repeat(${cols}, ${rank.cellWidth ? `${rank.cellWidth}px` : `minmax(120px, 1fr)`})`,
                            gap: `${rank.gap ?? 0}px`,
                        }}
                      >
                          {rowCells.map((cell) => {
                             const globalIndex = rank.cells.indexOf(cell);

                             return (
                                <Cell
                                  key={cell.id}
                                  index={globalIndex}
                                  data={cell}
                                  styleMode={rank.style}
                                  showRankNumber={rank.showNumbers ?? true}
                                  isSelected={interactionState?.type === 'cell' && interactionState.index === globalIndex}
                                  onUpload={onUpload}
                                  onClear={onClear}
                                  onSwap={onSwap}
                                  onInboxDrop={onInboxDrop}
                                  onSearchDrop={onSearchDrop}
                                  onDownloadSingle={onDownloadSingle}
                                  onInteract={onInteract}
                                  onUpdateCell={onUpdateCell}
                                  borderless={rank.borderless}
                                  aspectRatio={rank.aspectRatio}
                                />
                             );
                          })}
                      </div>
                  </div>
              ))}
          </div>
      );
  }

  // Standard Grid View
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, ${rank.cellWidth ? `${rank.cellWidth}px` : `minmax(120px, 1fr)`})`,
        gap: `${rank.gap ?? 0}px`,
      }}
    >
      {rank.cells.map((cell, index) => (
        <Cell
          key={cell.id}
          index={index}
          data={cell}
          styleMode={rank.style}
          showRankNumber={rank.showNumbers ?? true}
          isSelected={interactionState?.type === 'cell' && interactionState.index === index}
          onUpload={onUpload}
          onClear={onClear}
          onSwap={onSwap}
          onInboxDrop={onInboxDrop}
          onInboxDropMulti={onInboxDropMulti}
          onSearchDrop={onSearchDrop}
          onDownloadSingle={onDownloadSingle}
          onInteract={onInteract}
          onUpdateCell={onUpdateCell}
          borderless={rank.borderless}
          aspectRatio={rank.aspectRatio}
        />
      ))}
    </div>
  );
};
