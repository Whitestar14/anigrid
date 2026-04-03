import React, { useRef, useState } from 'react';
import { Rank, CellData, InteractionState } from '@/types';
import { Upload, X, ArrowDownToLine, Plus, Star, Move } from 'lucide-react';

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

  return (
    <div 
      className={`
        flex items-center gap-4 p-3 bg-transparent group transition-all duration-200
        ${isDragOver ? 'ring-2 ring-primary bg-primary/10 z-20' : 'hover:bg-white/[0.02]'}
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
        <div className="w-10 sm:w-14 shrink-0 text-center flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-black text-white/20 group-hover:text-primary transition-colors leading-none">
            #{index + 1}
          </span>
        </div>
      )}

      {/* 2. Image Thumb */}
      <div 
        className="relative w-16 h-20 sm:w-20 sm:h-24 shrink-0 bg-black/40 rounded-lg overflow-hidden cursor-pointer group/image border border-white/5 shadow-sm transition-transform group-hover:scale-[1.02]"
        onClick={() => {
            if(!data.imageSrc) fileInputRef.current?.click();
            else onInteract(index);
        }}
      >
         <input
            type="file" ref={fileInputRef} className="hidden" accept="image/*"
            onChange={(e) => e.target.files?.[0] && onUpload(index, e.target.files[0])}
         />
         {data.imageSrc ? (
            <>
              <img src={data.imageSrc} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/image:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[1px]">
                 <button onClick={(e) => { e.stopPropagation(); onClear(index); }} className="text-white/70 hover:text-red-400 p-1 hover:bg-white/10 rounded-full transition-colors"><X size={14}/></button>
                 <button onClick={(e) => { e.stopPropagation(); onInteract(index); }} className="text-white/70 hover:text-primary p-1 hover:bg-white/10 rounded-full transition-colors"><Move size={14}/></button>
                 <button onClick={(e) => { e.stopPropagation(); onMoveToInbox(index); }} className="text-white/70 hover:text-primary p-1 hover:bg-white/10 rounded-full transition-colors"><ArrowDownToLine size={14}/></button>
              </div>
            </>
         ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted hover:text-white transition-colors gap-1">
               <Plus size={20} className="opacity-50" />
               <span className="text-[10px] uppercase font-bold tracking-wider opacity-50">Add</span>
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
    <div className="flex flex-col w-full max-w-4xl min-w-0 bg-[#1c1c1e] rounded-2xl overflow-hidden shadow-sm divide-y divide-white/5">
      {rank.cells.map((cell, index) => (
        <ListRow
          key={cell.id}
          index={index}
          data={cell}
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