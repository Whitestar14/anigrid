import React, { useRef, useState } from 'react';
import { Upload, X, ArrowDownToLine, Plus, Star, Move, Check, GripVertical, Globe, Trash2, Search } from 'lucide-react';
import { getProxiedImageUrl } from '@/utils/imageProxy';
import { UrlInputModal } from '@/components/ui/UrlInputModal';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/store/useStore';
import { selectActiveRank } from '@/store/selectors';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PopoverMenu } from '@/components/ui/PopoverMenu';
import { usePanZoom } from '@/hooks/usePanZoom';
import { useCellInteraction } from '@/hooks/useCellInteraction';
import { useCellMediaUpload } from '@/hooks/useCellMediaUpload';
import { LIST_ASPECT_MAP } from '@/utils/ui';
import { CellData } from '@/types';

export interface ListRowProps {
  index: number;
  data: CellData;
}

export const ListRow = React.memo(function ListRow({
  index,
  data,
}: ListRowProps) {
  const activeRank = useStore(selectActiveRank);

  const handleCellClear = useStore(s => s.handleCellClear);
  const handleUpdateCell = useStore(s => s.handleUpdateCell);
  const handleMoveToInbox = useStore(s => s.handleMoveToInbox);
  const handleCellUpload = useStore(s => s.handleCellUpload);

  const rowRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);

  const { isSelected, localClickPoint, handleInteraction, clearInteraction } = useCellInteraction({
    type: 'cell',
    index
  });

  const { fileInputRef, triggerPicker, handleFileChange } = useCellMediaUpload((base64) => {
    handleCellUpload(index, base64 as string);
    clearInteraction();
  });

  const [localText, setLocalText] = useState(data?.textLabel || '');
  React.useEffect(() => {
    setLocalText(data?.textLabel || '');
  }, [data?.textLabel]);

  if (!data || !activeRank) return null;

  const borderRadius = activeRank.borderRadius ?? 12;
  const aspectRatio = activeRank.aspectRatio || '3:4';
  const showNumbers = activeRank.showNumbers ?? true;
  const rankStyle = activeRank.style || 'card';
  const borderless = activeRank.borderless ?? false;

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
    { zoom: data?.zoom, posX: data?.objectPosition ? parseInt(data.objectPosition.split(' ')[0]) : 50, posY: data?.objectPosition ? parseInt(data.objectPosition.split(' ')[1]) : 50 },
    imageContainerRef,
    (state) => handleUpdateCell(index, { zoom: state.zoom, objectPosition: `${state.posX}% ${state.posY}%` })
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: data?.id || `cell-${index}`,
    data: {
      type: 'cell',
      index,
      imageSrc: data?.imageSrc,
      textLabel: data?.textLabel,
      width: rowRef.current?.offsetWidth,
      isRow: true
    },
    disabled: isAdjusting
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const actions = data.imageSrc ? [
    { label: 'Replace', icon: Upload, onClick: triggerPicker },
    { label: 'Crop & Adjust', icon: Move, onClick: startAdjusting },
    { label: 'To Inbox', icon: ArrowDownToLine, onClick: () => handleMoveToInbox(index) },
    { label: 'Remove', icon: Trash2, onClick: () => handleCellClear(index), variant: 'danger' as const },
  ] : [
    { label: 'Local File', icon: Upload, onClick: triggerPicker },
    { label: 'From URL', icon: Globe, onClick: () => setIsUrlModalOpen(true) },
    { label: "Search Online", icon: Search, onClick: () => window.dispatchEvent(new CustomEvent('open-inbox-search')) },
  ];

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (rowRef as any).current = node;
      }}
      style={style}
      className={`
        group relative flex items-center gap-4
        ${rankStyle === 'card' ? 'p-3 bg-surface rounded-2xl' : 'p-3 bg-transparent hover:bg-hover'}
        ${rankStyle === 'seamless' && borderless ? 'border-none' : rankStyle === 'seamless' ? 'border-b border-border' : ''}
        ${isDragging ? 'opacity-20 grayscale z-0' : 'z-10'}
        ${isSelected ? 'bg-primary/5 ring-1 ring-primary/20 shadow-lg' : ''}
        ${isOver ? 'focus-ring bg-primary/5 scale-[1.02] z-20 shadow-xl' : 'hover:bg-hover'}
      `}
      onClick={(e) => {
        if (isAdjusting) return;
        handleInteraction(e.clientX, e.clientY, e.target as HTMLElement);
      }}
    >
      <div className="flex items-center gap-2 shrink-0" {...attributes} {...listeners}>
        <GripVertical size={16} className="text-muted group-hover:text-text cursor-grab active:cursor-grabbing transition-colors" />
        <AnimatePresence mode="popLayout" initial={false}>
          {showNumbers && (
            <motion.div
              initial={{ opacity: 0, x: -10, width: 0, marginRight: 0 }}
              animate={{ opacity: 1, x: 0, width: 'auto', marginRight: 12 }}
              exit={{ opacity: 0, x: -10, width: 0, marginRight: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="shrink-0 text-center overflow-hidden"
            >
              <span className="text-xl sm:text-2xl font-black text-muted leading-none select-none">
                #{index + 1}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        ref={imageContainerRef}
        className={`relative shrink-0 ${LIST_ASPECT_MAP[aspectRatio] || 'aspect-[3/4] w-16 sm:w-20'}`}
      >
        {data.imageSrc ? (
          <div
            className={`w-full h-full relative cursor-pointer group/image overflow-hidden border border-border shadow-sm transition-all ${isSelected && !isAdjusting ? 'scale-[1.02] ring-2 ring-primary' : 'hover:scale-[1.02]'}`}
            style={{ borderRadius }}
          >
            <img
              src={getProxiedImageUrl(data.imageSrc)}
              alt=""
              className="w-full h-full object-cover pointer-events-none"
              style={{
                objectPosition: isAdjusting ? `${posX}% ${posY}%` : (data.objectPosition || 'center'),
                transform: `scale(${isAdjusting ? zoom : (data.zoom || 1)})`,
                transformOrigin: 'center'
              }}
              referrerPolicy="no-referrer"
            />

            {isAdjusting && (
              <div
                className="adjust-controls absolute inset-0 bg-surface/50 backdrop-blur-[2px] flex flex-col items-center justify-between p-2 z-30 cursor-move"
                onMouseDown={(e) => { e.stopPropagation(); setIsAdjustDragging(true); }}
                onWheel={handleWheel}
              >
                <div className="bg-surface-elevated text-text text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-border shadow-2xl mt-1">Pan & Zoom</div>
                <div className="flex gap-2 mb-1">
                  <button onClick={(e) => { e.stopPropagation(); stopAdjusting(); }} className="p-1.5 bg-surface-elevated hover:bg-hover text-text rounded-full border border-border"><X size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); saveAdjustments(); clearInteraction(); }} className="p-1.5 bg-primary hover:bg-primary/80 text-white rounded-full shadow-lg"><Check size={14} /></button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className="w-full h-full bg-surface-secondary border border-border shadow-sm flex flex-col items-center justify-center text-muted gap-2 cursor-pointer hover:bg-hover transition-colors group/empty"
            style={{ borderRadius }}
          >
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <Plus size={24} className="opacity-30 group-hover/empty:opacity-100 transition-opacity" />
            <span className="text-[10px] uppercase font-black tracking-widest opacity-30 group-hover/empty:opacity-100">Add</span>
          </div>
        )}

        <PopoverMenu
          isOpen={isSelected && !isAdjusting}
          onClose={clearInteraction}
          actions={actions}
          triggerPoint={localClickPoint}
          align={data.imageSrc ? 'center' : 'bottom'}
          className={data.imageSrc ? 'mt-[-10px]' : ''}
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <input
          type="text"
          placeholder="Enter Title..."
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          onBlur={() => {
            if (localText !== (data.textLabel || '')) {
              handleUpdateCell(index, { textLabel: localText });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-transparent text-lg sm:text-xl font-bold text-text focus:outline-none placeholder:text-muted truncate py-1 transition-colors border-none focus:ring-0 p-0"
        />
        <div className="sm:hidden flex items-center gap-1 text-xs font-bold text-yellow-500/80">
          <Star size={10} className="fill-yellow-500" />
          {data.rating ? <span>{data.rating}/10</span> : <span className="text-muted">No Rating</span>}
        </div>
      </div>

      <div className="relative shrink-0 flex items-center justify-center px-2">
        <div className="hidden sm:flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
            <button
              key={star}
              onClick={(e) => { e.stopPropagation(); handleUpdateCell(index, { rating: star === data.rating ? 0 : star }); }}
              className="focus:outline-none group/star p-0.5 hover:scale-125 transition-transform"
            >
              <Star
                size={14}
                className={`${(data.rating || 0) >= star ? 'fill-yellow-500 text-yellow-500' : 'text-muted/30 group-hover/star:text-yellow-500/40'} transition-colors`}
              />
            </button>
          ))}
        </div>
        <div className="sm:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface border border-transparent hover:border-border">
          <Star size={20} className={`${data.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted/30'}`} />
          <select
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            value={data.rating || 0}
            onChange={(e) => { e.stopPropagation(); handleUpdateCell(index, { rating: Number(e.target.value) }); }}
          >
            <option value="0">No Rating</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(r => (
              <option key={r} value={r}>{r} Stars</option>
            ))}
          </select>
        </div>
      </div>

      <UrlInputModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onSubmit={(url) => { handleCellUpload(index, url); clearInteraction(); }}
      />
    </div>
  );
});
