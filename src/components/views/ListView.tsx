import React, { useRef, useState } from 'react';
import { Rank, CellData, InteractionState } from '@/types';
import { Upload, X, ArrowDownToLine, Plus, Star, Move } from 'lucide-react';
import { getProxiedImageUrl } from '@/utils/imageProxy';

interface ListViewProps {
  rank: Rank;
  onUpload: (index: number, file: File) => void;
  onClear: (index: number) => void;
  onSwap: (fromIndex: number, toIndex: number) => void;
  onInboxDrop: (itemId: string, collectionId: string, toIndex: number) => void;
  onInboxDropMulti: (itemIds: string[], collectionId: string, toIndex: number) => void;
  onSearchDrop: (imageSrc: string, toIndex: number) => void;
  onMoveToInbox: (index: number) => void;
  onUpdateCell: (index: number, data: Partial<CellData>) => void;
  // Interaction
  interactionState: InteractionState;
  onInteract: (index: number) => void;
}

interface ListRowProps {
  index: number;
  data: CellData;
  rankStyle: 'seamless' | 'card';
  borderless: boolean;
  aspectRatio: string;
  showNumbers: boolean;
  onUpload: (index: number, file: File) => void;
  onClear: (index: number) => void;
  onSwap: (fromIndex: number, toIndex: number) => void;
  onInboxDrop: (itemId: string, collectionId: string, toIndex: number) => void;
  onInboxDropMulti: (itemIds: string[], collectionId: string, toIndex: number) => void;
  onSearchDrop: (imageSrc: string, toIndex: number) => void;
  onMoveToInbox: (index: number) => void;
  onUpdateCell: (index: number, data: Partial<CellData>) => void;
  isSelected: boolean;
  onInteract: (index: number) => void;
}

const ListRow: React.FC<ListRowProps> = ({
  index,
  data,
  rankStyle,
  borderless,
  aspectRatio,
  showNumbers,
  onUpload,
  onClear,
  onSwap,
  onInboxDrop,
  onInboxDropMulti,
  onSearchDrop,
  onMoveToInbox,
  onUpdateCell,
  isSelected,
  onInteract
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onUpload(index, file);
      }
      return;
    }

    const dragData = e.dataTransfer.getData('application/json');
    if (dragData) {
      try {
        const source = JSON.parse(dragData);
        if (source.type === 'cell') {
          if (source.index !== index) onSwap(source.index, index);
        } else if (source.type === 'inbox') {
          onInboxDrop(source.id, source.originCollectionId, index);
        } else if (source.type === 'inbox-multi') {
          onInboxDropMulti(source.ids, source.originCollectionId, index);
        } else if (source.type === 'search') {
          onSearchDrop(source.imageSrc, index);
        }
      } catch (err) {}
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'cell', index }));
    e.dataTransfer.effectAllowed = 'copyMove';
    setTimeout(() => setIsDragging(true), 0);
  };

  const aspectMap: Record<string, string> = {
    '1:1': 'aspect-square w-20',
    '3:4': 'aspect-[3/4] w-16 sm:w-20',
    '4:3': 'aspect-[4/3] w-24 sm:w-28',
    '16:9': 'aspect-video w-28 sm:w-32',
    '9:16': 'aspect-[9/16] w-14 sm:w-16'
  };

  return (
    <div
      className={`
        flex items-center gap-4 transition-all duration-200
        ${rankStyle === 'card' ? 'p-3 bg-[#2c2c2e] rounded-2xl' : 'p-3 bg-transparent hover:bg-white/[0.02]'}
        ${rankStyle === 'seamless' && borderless ? 'border-none' : rankStyle === 'seamless' ? 'border-b border-white/5' : ''}
        ${isDragOver ? 'ring-2 ring-primary bg-primary/10 z-20' : ''}
        ${isSelected ? 'bg-primary/5' : ''}
        ${isDragging ? 'opacity-40 grayscale' : ''}
      `}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); e.dataTransfer.dropEffect = 'copy'; }}
      onDragLeave={() => setIsDragOver(false)}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => setIsDragging(false)}
    >
      {/* 1. Rank Number */}
      {showNumbers && (
        <div className="w-8 sm:w-12 shrink-0 text-center flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-black text-white/20 group-hover:text-primary transition-colors leading-none">
            #{index + 1}
          </span>
        </div>
      )}

      {/* 2. Image Thumb uses Cell.tsx for full features */}
      <div
        className={`relative shrink-0 ${aspectMap[aspectRatio] || 'aspect-[3/4] w-16 sm:w-20'}`}
      >
          {data.imageSrc ? (
            <div className="w-full h-full relative cursor-pointer group/image rounded-lg overflow-hidden border border-white/5 shadow-sm transition-transform hover:scale-[1.02]">
                <img src={getProxiedImageUrl(data.imageSrc)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/image:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[1px]">
                    <button onClick={(e) => { e.stopPropagation(); onClear(index); }} className="text-white/70 hover:text-red-400 p-1 hover:bg-white/10 rounded-full transition-colors"><X size={14}/></button>
                    <button onClick={(e) => { e.stopPropagation(); onInteract(index); }} className="text-white/70 hover:text-primary p-1 hover:bg-white/10 rounded-full transition-colors"><Move size={14}/></button>
                    <button onClick={(e) => { e.stopPropagation(); onMoveToInbox(index); }} className="text-white/70 hover:text-primary p-1 hover:bg-white/10 rounded-full transition-colors"><ArrowDownToLine size={14}/></button>
                </div>
            </div>
          ) : (
            <div
               onClick={() => onInteract(index)}
               className="w-full h-full bg-black/40 rounded-lg border border-white/5 shadow-sm flex flex-col items-center justify-center text-muted hover:text-white transition-colors gap-1 cursor-pointer"
            >
               <input
                  type="file" ref={fileInputRef} className="hidden" accept="image/*"
                  onChange={(e) => {
                      if (e.target.files?.[0]) onUpload(index, e.target.files[0]);
                      onInteract(-1); // Deselect on upload
                  }}
               />
               <Plus size={20} className="opacity-50" />
               <span className="text-[10px] uppercase font-bold tracking-wider opacity-50">Add</span>

               {/* Popover Menu (Empty State equivalent mapping) */}
               {isSelected && (
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 bg-[#2c2c2e]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl z-[100] flex flex-col p-1 animate-in fade-in zoom-in-95">
                      <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="flex items-center justify-between p-2 hover:bg-white/10 rounded-xl text-[11px] font-medium text-white transition-colors">
                         Local <Upload size={12} className="text-white/50" />
                      </button>
                      <button onClick={(e) => {
                         e.stopPropagation();
                         const url = prompt("Enter Image URL");
                         if (url) onSearchDrop(url, index);
                         onInteract(-1);
                      }} className="flex items-center justify-between p-2 hover:bg-white/10 rounded-xl text-[11px] font-medium text-white transition-colors">
                         URL <ArrowDownToLine size={12} className="text-white/50" />
                      </button>
                   </div>
               )}
            </div>
          )}
      </div>

      {/* 3. Title Input */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
         <input
           type="text"
           placeholder="Enter Title..."
           value={data.textLabel || ''}
           onChange={(e) => onUpdateCell(index, { textLabel: e.target.value })}
           className="w-full bg-transparent text-lg sm:text-xl font-bold text-white focus:outline-none placeholder:text-white/10 truncate py-1 transition-colors"
         />
         {/* Mobile Rating Display (when star array hidden) */}
         <div className="sm:hidden flex items-center gap-1 text-xs font-bold text-yellow-500/80">
             <Star size={10} className="fill-yellow-500" />
             {data.rating ? <span>{data.rating}/10</span> : <span className="text-white/20">No Rating</span>}
         </div>
      </div>

      {/* 4. Rating (Right Side) */}
      <div className="relative shrink-0 flex items-center justify-center px-2">
         {/* Desktop Star Array */}
         <div className="hidden sm:flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  onClick={() => onUpdateCell(index, { rating: star === data.rating ? 0 : star })}
                  className="focus:outline-none group/star p-0.5"
                >
                   <Star
                     size={14}
                     className={`
                       ${(data.rating || 0) >= star ? 'fill-yellow-500 text-yellow-500' : 'text-white/10 group-hover/star:text-yellow-500/40'}
                       transition-colors
                     `}
                   />
                </button>
            ))}
         </div>

         {/* Mobile Rating Touch Target */}
         <div className="sm:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface border border-transparent hover:border-border">
             <Star
               size={20}
               className={`${data.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted/30'}`}
             />
             <select
                className="absolute inset-0 opacity-0 w-full h-full"
                value={data.rating || 0}
                onChange={(e) => onUpdateCell(index, { rating: Number(e.target.value) })}
             >
                <option value="0">No Rating</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(r => (
                    <option key={r} value={r}>{r} Stars</option>
                ))}
             </select>
         </div>
      </div>
    </div>
  );
};

export const ListView: React.FC<ListViewProps> = ({
  rank,
  onUpload,
  onClear,
  onSwap,
  onInboxDrop,
  onInboxDropMulti,
  onSearchDrop,
  onMoveToInbox,
  onUpdateCell,
  interactionState,
  onInteract
}) => {
  return (
    <div
      className={`flex flex-col w-full min-w-0 ${rank.style === 'card' ? 'gap-3' : 'divide-y divide-white/5'}`}
      style={rank.style === 'card' ? { gap: rank.gap ?? 8 } : {}}
    >
      {rank.cells.map((cell, index) => (
        <ListRow
          key={cell.id}
          index={index}
          data={cell}
          rankStyle={rank.style ?? 'card'}
          borderless={rank.borderless ?? false}
          aspectRatio={rank.aspectRatio ?? '3:4'}
          showNumbers={rank.showNumbers ?? true}
          isSelected={interactionState?.type === 'cell' && interactionState.index === index}
          onInteract={onInteract}
          onUpload={onUpload}
          onClear={onClear}
          onSwap={onSwap}
          onInboxDrop={onInboxDrop}
          onInboxDropMulti={onInboxDropMulti}
          onSearchDrop={onSearchDrop}
          onMoveToInbox={onMoveToInbox}
          onUpdateCell={onUpdateCell}
        />
      ))}
    </div>
  );
};