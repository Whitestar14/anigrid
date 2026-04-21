import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Upload, Download, Crop, Check, Globe, Search, Trash2 } from 'lucide-react';
import { CellData, GridStyle } from '@/types';
import { getProxiedImageUrl } from '@/utils/imageProxy';

interface CellProps {
  index: number;
  data: CellData;
  styleMode: GridStyle;
  showRankNumber: boolean;
  isSelected: boolean;
  borderless?: boolean; // New prop
  aspectRatio?: '1:1' | '3:4' | '4:3' | '16:9' | '9:16';
  onUpload: (index: number, file: File) => void;
  onClear: (index: number) => void;
  onSwap: (fromIndex: number, toIndex: number) => void;
  onInboxDrop: (itemId: string, collectionId: string, toIndex: number) => void;
  onInboxDropMulti?: (itemIds: string[], collectionId: string, toIndex: number) => void;
  onSearchDrop: (imageSrc: string, toIndex: number) => void;
  onMoveToInbox: (index: number) => void;
  onDownloadSingle: (index: number) => void;
  onInteract: (index: number) => void;
  onUpdateCell: (index: number, data: Partial<CellData>) => void;
}

export const Cell: React.FC<CellProps> = ({
  index,
  data,
  styleMode,
  showRankNumber,
  isSelected,
  borderless,
  aspectRatio = '3:4',
  onUpload,
  onClear,
  onSwap,
  onInboxDrop,
  onInboxDropMulti,
  onSearchDrop,
  _onMoveToInbox,
  onDownloadSingle,
  onInteract,
  onUpdateCell
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);

  const [zoom, setZoom] = useState(data.zoom || 1);
  const [posX, setPosX] = useState(data.objectPosition ? parseInt(data.objectPosition.split(' ')[0]) : 50);
  const [posY, setPosY] = useState(data.objectPosition ? parseInt(data.objectPosition.split(' ')[1]) : 50);

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.adjust-controls') || (e.target as HTMLElement).closest('.popover-menu')) return;

    onInteract(index);
  };

  const _handleAlignmentCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const current = data.alignment || 'center';
    const next = current === 'center' ? 'top' : current === 'top' ? 'bottom' : 'center';
    onUpdateCell(index, { alignment: next });
  };

  const saveAdjustments = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateCell(index, { zoom, objectPosition: `${posX}% ${posY}%` });
    setIsAdjusting(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(index, e.target.files[0]);
    }
    e.target.value = '';
  };

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
          if (source.index !== index) {
            onSwap(source.index, index);
          }
        } else if (source.type === 'inbox') {
          onInboxDrop(source.id, source.originCollectionId, index);
        } else if (source.type === 'inbox-multi') {
          if (onInboxDropMulti) {
            onInboxDropMulti(source.ids, source.originCollectionId, index);
          } else {
            onInboxDrop(source.ids[0], source.originCollectionId, index);
          }
        } else if (source.type === 'search') {
          onSearchDrop(source.imageSrc, index);
        }
      } catch (err) {
        console.error("Invalid drag data", err);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (data.imageSrc) {
      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'cell', index }));
      e.dataTransfer.effectAllowed = 'copyMove';
      setTimeout(() => setIsDragging(true), 0);
    } else {
      e.preventDefault();
    }
  };

  const roundedClass = styleMode === 'card' ? 'rounded-2xl' : 'rounded-none';
  // If seamless and NOT borderless, show border. If borderless is true, hide it.
  const outlineClass = styleMode === 'seamless' && !borderless && !isDragOver && !isSelected ? 'outline outline-1 outline-border -outline-offset-1' : '';
  const bgClass = styleMode === 'card' ? 'bg-surface shadow-sm border border-white/5' : 'bg-surface';

  const align = data.alignment || 'center';
  const objectPosStyle: React.CSSProperties = {
      objectPosition: isAdjusting ? `${posX}% ${posY}%` : (data.objectPosition || (align === 'top' ? 'top' : align === 'bottom' ? 'bottom' : 'center')),
      transform: `scale(${isAdjusting ? zoom : (data.zoom || 1)})`,
      transformOrigin: 'center'
  };

  const aspectMap: Record<string, string> = {
    '1:1': 'aspect-square',
    '3:4': 'aspect-[3/4]',
    '4:3': 'aspect-[4/3]',
    '16:9': 'aspect-video',
    '9:16': 'aspect-[9/16]'
  };

  return (
    <div
      className={`
        relative group/cell transition-all duration-200 ${aspectMap[aspectRatio] || 'aspect-[3/4]'}
        ${roundedClass}
        ${isDragOver ? 'z-20 scale-105 shadow-2xl' : 'z-10'}
        ${isSelected ? 'z-30' : ''}
        ${isDragging ? 'opacity-40 scale-95 grayscale' : ''}
      `}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDragStart={handleDragStart}
      onDragEnd={() => setIsDragging(false)}
      draggable={!!data.imageSrc && !isAdjusting}
    >
      <div
        className={`w-full h-full relative overflow-hidden ${roundedClass} ${bgClass} ${outlineClass} ${isDragOver ? 'ring-4 ring-primary bg-primary/20' : ''} ${isSelected ? 'ring-2 ring-primary shadow-xl scale-[0.98]' : ''} ${!data.imageSrc ? 'cursor-pointer hover:bg-hover' : 'cursor-pointer'}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />

        {data.imageSrc ? (
          <>
            <img
              src={getProxiedImageUrl(data.imageSrc)}
              alt={`Rank ${index + 1}`}
              className="w-full h-full object-cover select-none pointer-events-none transition-all duration-300"
              style={objectPosStyle}
              referrerPolicy="no-referrer"
            />

            {/* Overlay Controls (Desktop Hover) */}
            {!isAdjusting && (
              <div className={`export-hidden absolute inset-0 bg-black/40 opacity-0 group-hover/cell:opacity-100 transition-all duration-200 hidden md:flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]`}>

                 <div className="flex items-center gap-1 p-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-xl transform translate-y-2 group-hover/cell:translate-y-0 transition-transform duration-200">
                    <button
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                      title="Replace Image"
                    >
                      <Upload size={14} />
                    </button>
                    <div className="w-px h-4 bg-white/10"></div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsAdjusting(true); }}
                      className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                      title="Crop & Adjust"
                    >
                      <Crop size={14} />
                    </button>
                    <div className="w-px h-4 bg-white/10"></div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDownloadSingle(index); }}
                      className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                      title="Download Image"
                    >
                      <Download size={14} />
                    </button>
                    <div className="w-px h-4 bg-white/10"></div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onClear(index); }}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full transition-colors"
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                 </div>
              </div>
            )}

            {/* Adjust Controls */}
            {isAdjusting && (
              <div className="export-hidden adjust-controls absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 gap-4 z-40">
                <div className="w-full max-w-[150px] flex flex-col gap-3 bg-black/40 p-3 rounded-xl border border-white/10">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-white/70 font-bold uppercase tracking-wider flex justify-between">
                      <span>Zoom</span>
                      <span>{zoom.toFixed(1)}x</span>
                    </label>
                    <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full accent-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-white/70 font-bold uppercase tracking-wider flex justify-between">
                      <span>Pan X</span>
                      <span>{posX}%</span>
                    </label>
                    <input type="range" min="0" max="100" value={posX} onChange={(e) => setPosX(parseInt(e.target.value))} className="w-full accent-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-white/70 font-bold uppercase tracking-wider flex justify-between">
                      <span>Pan Y</span>
                      <span>{posY}%</span>
                    </label>
                    <input type="range" min="0" max="100" value={posY} onChange={(e) => setPosY(parseInt(e.target.value))} className="w-full accent-primary" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setIsAdjusting(false); }} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
                    <X size={16} />
                  </button>
                  <button onClick={saveAdjustments} className="p-2 bg-primary hover:bg-primary/80 text-white rounded-full transition-colors">
                    <Check size={16} />
                  </button>
                </div>
              </div>
            )}

            {showRankNumber && !isAdjusting && (
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm pointer-events-none z-10 shadow-sm border border-white/10">
                #{index + 1}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted group-hover/cell:text-text transition-colors export-hidden pointer-events-none bg-[#2c2c2e]/20">
            <Plus size={32} className="mb-2 opacity-30 group-hover/cell:opacity-100 transition-opacity" />
            <span className="text-xs font-bold uppercase tracking-wider opacity-50">Add</span>
          </div>
        )}
      </div>

      {/* Popover Menu (Empty State) */}
      <AnimatePresence>
        {isSelected && !data.imageSrc && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="popover-menu absolute top-0 w-max min-w-[140px] left-1/2 -translate-x-1/2 bg-[#2c2c2e]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl z-[100] flex flex-col p-1 mt-[-10px]"
          >
             <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="flex items-center justify-between p-3 hover:bg-white/10 rounded-xl text-[13px] font-medium text-white transition-colors gap-2">
                Local File <Upload size={16} className="text-white/50" />
             </button>
             <div className="h-px bg-white/10 mx-2 my-0.5" />
             <button onClick={(e) => {
                e.stopPropagation();
                const url = prompt("Enter Image URL");
                if (url) onSearchDrop(url, index);
                onInteract(-1);
             }} className="flex items-center justify-between p-3 hover:bg-white/10 rounded-xl text-[13px] font-medium text-white transition-colors gap-2">
                From URL <Globe size={16} className="text-white/50" />
             </button>
             <div className="h-px bg-white/10 mx-2 my-0.5" />
             <button onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('open-inbox-search'));
                onInteract(-1);
             }} className="flex items-center justify-between p-3 hover:bg-white/10 rounded-xl text-[13px] font-medium text-white transition-colors gap-2">
                Search Online <Search size={16} className="text-white/50" />
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popover Menu (Filled State - Mobile Only) */}
      <AnimatePresence>
        {isSelected && data.imageSrc && !isAdjusting && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="popover-menu md:hidden absolute top-0 w-max min-w-[140px] left-1/2 -translate-x-1/2 bg-[#2c2c2e]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl z-[100] flex flex-col p-1 mt-[-10px]"
          >
             <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="flex items-center justify-between p-3 hover:bg-white/10 rounded-xl text-[13px] font-medium text-white transition-colors gap-2">
                Replace <Upload size={16} className="text-white/50" />
             </button>
             <div className="h-px bg-white/10 mx-2 my-0.5" />
             <button onClick={(e) => { e.stopPropagation(); setIsAdjusting(true); }} className="flex items-center justify-between p-3 hover:bg-white/10 rounded-xl text-[13px] font-medium text-white transition-colors gap-2">
                Crop & Adjust <Crop size={16} className="text-white/50" />
             </button>
             <div className="h-px bg-white/10 mx-2 my-0.5" />
             <button onClick={(e) => { e.stopPropagation(); onDownloadSingle(index); onInteract(-1); }} className="flex items-center justify-between p-3 hover:bg-white/10 rounded-xl text-[13px] font-medium text-white transition-colors gap-2">
                Download <Download size={16} className="text-white/50" />
             </button>
             <div className="h-px bg-white/10 mx-2 my-0.5" />
             <button onClick={(e) => { e.stopPropagation(); onClear(index); onInteract(-1); }} className="flex items-center justify-between p-3 hover:bg-red-500/20 text-red-500 rounded-xl text-[13px] font-medium transition-colors gap-2">
                Remove <Trash2 size={16} className="text-red-500/50" />
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};