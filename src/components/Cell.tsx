import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Plus, X, Upload, Download, Crop, Check, Globe, Search, Trash2, ArrowDownToLine } from 'lucide-react';
import { CellData, GridStyle } from '@/types';
import { getProxiedImageUrl } from '@/utils/imageProxy';
import { ASPECT_MAP } from '@/utils/ui';
import { UrlInputModal } from '@/components/ui/UrlInputModal';
import { useStore } from '@/store/useStore';
import { selectCellByIndex, selectActiveRank } from '@/store/selectors';
import { PopoverMenu } from '@/components/ui/PopoverMenu';
import { usePanZoom } from '@/hooks/usePanZoom';

interface CellProps {
  index: number;
  styleMode: GridStyle;
  showRankNumber: boolean;
  isSelected: boolean;
  borderless?: boolean;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '16:9' | '9:16';
  onUpload: (index: number, file: File) => void;
  onClear: (index: number) => void;
  onSwap: (fromIndex: number, toIndex: number) => void;
  onInboxDrop: (itemId: string, collectionId: string, toIndex: number) => void;
  onInboxDropMulti?: (itemIds: string[], collectionId: string, toIndex: number) => void;
  onMoveToInbox?: (index: number) => void;
  onSearchDrop: (imageSrc: string, toIndex: number) => void;
  onDownloadSingle: (index: number) => void;
  onInteract: (index: number, point?: { x: number; y: number } | null) => void;
  onUpdateCell: (index: number, data: Partial<CellData>) => void;
}

export const Cell = React.memo(function Cell({
  index,
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
  onDownloadSingle,
  onInteract,
  onUpdateCell,
  onMoveToInbox
}: CellProps) {
  const data = useStore(selectCellByIndex(index));
  const activeRank = useStore(selectActiveRank);
  if (!data) return null;

  const cellRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFileDragOver, setIsFileDragOver] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [localClickPoint, setLocalClickPoint] = useState<{ x: number; y: number } | null>(null);

  const borderRadius = activeRank?.borderRadius ?? 12;

  const {
    isAdjusting,
    setIsAdjustDragging,
    zoom,
    posX,
    posY,
    handleWheel,
    startAdjusting,
    stopAdjusting,
    saveAdjustments
  } = usePanZoom(
    { zoom: data.zoom, posX: data.objectPosition ? parseInt(data.objectPosition.split(' ')[0]) : 50, posY: data.objectPosition ? parseInt(data.objectPosition.split(' ')[1]) : 50 },
    cellRef,
    (state) => onUpdateCell(index, { zoom: state.zoom, objectPosition: `${state.posX}% ${state.posY}%` })
  );

  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: `cell-drop-${index}`,
    data: { type: 'cell', index }
  });

  const { isDragging, setNodeRef: setDraggableRef, attributes, listeners } = useDraggable({
    id: `cell-drag-${index}`,
    data: {
      type: 'cell',
      index,
      imageSrc: data.imageSrc,
      width: cellRef.current?.offsetWidth || 120,
      aspectRatio: aspectRatio.replace(':', '/')
    },
    disabled: !data.imageSrc || isAdjusting
  });

  const setRefs = (node: HTMLDivElement | null) => {
    (cellRef as any).current = node;
    setDroppableRef(node);
    setDraggableRef(node);
  };

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.popover-menu') || (e.target as HTMLElement).closest('.adjust-controls')) return;
    e.stopPropagation();
    const point = { x: e.clientX, y: e.clientY };
    setLocalClickPoint(point);
    onInteract(index, point);
  };

  const actions = data.imageSrc ? [
    { label: 'Replace', icon: Upload, onClick: () => fileInputRef.current?.click() },
    { label: 'Crop & Adjust', icon: Crop, onClick: startAdjusting },
    { label: 'To Inbox', icon: ArrowDownToLine, onClick: () => onMoveToInbox?.(index) },
    { label: 'Download', icon: Download, onClick: () => onDownloadSingle(index) },
    { label: 'Remove', icon: Trash2, onClick: () => onClear(index), variant: 'danger' as const },
  ] : [
    { label: 'Local File', icon: Upload, onClick: () => fileInputRef.current?.click() },
    { label: 'From URL', icon: Globe, onClick: () => setIsUrlModalOpen(true) },
    { label: 'Search Online', icon: Search, onClick: () => window.dispatchEvent(new CustomEvent('open-inbox-search')) },
  ];

  return (
    <motion.div
      ref={setRefs}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      {...attributes}
      {...listeners}
      className={`
        relative group/cell select-none cursor-pointer touch-none
        ${ASPECT_MAP[aspectRatio] || 'aspect-[3/4]'}
        ${isDragging ? 'z-50' : 'z-0'}
      `}
      onClick={handleClick}
      onDragOver={(e) => { e.preventDefault(); setIsFileDragOver(true); }}
      onDragLeave={() => setIsFileDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsFileDragOver(false);
        if (e.dataTransfer.files?.[0]) onUpload(index, e.dataTransfer.files[0]);
      }}
    >
      <div
        className={`
          w-full h-full overflow-hidden transition-all duration-300 relative
          ${borderless ? '' : 'border border-white/10 shadow-lg'}
          ${styleMode === 'card' ? 'bg-surface shadow-xl !rounded-2xl' : 'bg-transparent'}
          ${isSelected ? 'ring-2 ring-primary scale-[1.02] z-10' : 'hover:scale-[1.01] hover:border-white/20'}
          ${isFileDragOver ? 'ring-4 ring-primary ring-inset bg-primary/20' : ''}
          ${isOver ? 'ring-2 ring-primary bg-primary/10' : ''}
        `}
        style={{ borderRadius }}
      >
        {data.imageSrc ? (
          <>
            <img
              src={getProxiedImageUrl(data.imageSrc)}
              alt=""
              className={`w-full h-full object-cover transition-transform duration-200 pointer-events-none ${isDragging ? 'opacity-40' : 'opacity-100'}`}
              style={{
                objectPosition: isAdjusting ? `${posX}% ${posY}%` : (data.objectPosition || 'center'),
                transform: `scale(${isAdjusting ? zoom : (data.zoom || 1)})`,
                transformOrigin: 'center'
              }}
              referrerPolicy="no-referrer"
            />
            {showRankNumber && (
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-sm font-black size-8 flex items-center justify-center rounded-md border border-white/10 shadow-lg z-10 pointer-events-none">
                #{index + 1}
              </div>
            )}

            <AnimatePresence>
              {isAdjusting && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="adjust-controls absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-between p-2 z-40 cursor-move"
                  onMouseDown={(e) => { e.stopPropagation(); setIsAdjustDragging(true); }}
                  onWheel={handleWheel}
                >
                  <div className="bg-black/60 text-white text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-white/10 shadow-2xl mt-2">Pan & Zoom</div>
                  <div className="flex gap-2 mb-2">
                    <button onClick={(e) => { e.stopPropagation(); stopAdjusting(); }} className="p-2 bg-black/60 hover:bg-white/10 text-white rounded-full border border-white/10 shadow-xl backdrop-blur-xl transition-all active:scale-90"><X size={18} /></button>
                    <button onClick={(e) => { e.stopPropagation(); saveAdjustments(); onInteract(-1); }} className="p-2 bg-primary hover:bg-primary/80 text-white rounded-full shadow-xl transition-all active:scale-90"><Check size={18} /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted group-hover/cell:text-text transition-colors export-hidden pointer-events-none bg-[#2c2c2e]/20">
            <Plus size={32} className="mb-2 opacity-30 group-hover/cell:opacity-100 transition-opacity" />
            <span className="text-xs font-bold uppercase tracking-wider opacity-50">Add</span>
          </div>
        )}

        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) onUpload(index, e.target.files[0]); onInteract(-1); }} />

        <PopoverMenu
          isOpen={isSelected && !isAdjusting}
          onClose={() => { onInteract(-1); setLocalClickPoint(null); }}
          actions={actions}
          triggerPoint={localClickPoint}
          className={localClickPoint ? "" : "mt-[-20px]"}
        />
      </div>

      <UrlInputModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onSubmit={(url) => { onSearchDrop(url, index); onInteract(-1); }}
      />
    </motion.div>
  );
});