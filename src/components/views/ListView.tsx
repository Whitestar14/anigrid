import React, { useRef, useState } from 'react';
import { Upload, X, ArrowDownToLine, Plus, Star, Move, Check, GripVertical, Globe, Trash2, Search } from 'lucide-react';
import { getProxiedImageUrl } from '@/utils/imageProxy';
import { UrlInputModal } from '@/components/ui/UrlInputModal';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/store/useStore';
import { selectCellByIndex, selectActiveRank, selectCells } from '@/store/selectors';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PopoverMenu } from '@/components/ui/PopoverMenu';
import { usePanZoom } from '@/hooks/usePanZoom';
import { LIST_ASPECT_MAP } from '@/utils/ui';

interface ListRowProps {
  index: number;
  rankStyle: 'seamless' | 'card';
  borderless: boolean;
  aspectRatio: string;
  showNumbers: boolean;
}

const ListRow = React.memo(function ListRow({
  index,
  rankStyle,
  borderless,
  aspectRatio,
  showNumbers,
}: ListRowProps) {
  const data = useStore(selectCellByIndex(index));
  const activeRank = useStore(selectActiveRank);
  const interactionState = useStore(s => s.interactionState);
  const isSelected = interactionState?.type === 'cell' && interactionState.index === index;

  const handleCellClear = useStore(s => s.handleCellClear);
  const handleUpdateCell = useStore(s => s.handleUpdateCell);
  const handleMoveToInbox = useStore(s => s.handleMoveToInbox);
  const setInteractionState = useStore(s => s.setInteractionState);
  const handleCellUpload = useStore(s => s.handleCellUpload);

  const rowRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [localClickPoint, setLocalClickPoint] = useState<{ x: number; y: number } | null>(null);

  const [localText, setLocalText] = useState(data?.textLabel || '');
  React.useEffect(() => {
    setLocalText(data?.textLabel || '');
  }, [data?.textLabel]);

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

  if (!data) return null;



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleCellUpload(index, event.target.result as string);
          setInteractionState(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const actions = data.imageSrc ? [
    { label: 'Replace', icon: Upload, onClick: () => fileInputRef.current?.click() },
    { label: 'Crop & Adjust', icon: Move, onClick: startAdjusting },
    { label: 'To Inbox', icon: ArrowDownToLine, onClick: () => handleMoveToInbox(index) },
    { label: 'Remove', icon: Trash2, onClick: () => handleCellClear(index), variant: 'danger' as const },
  ] : [
    { label: 'Local File', icon: Upload, onClick: () => fileInputRef.current?.click() },
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

        const point = { x: e.clientX, y: e.clientY };
        setLocalClickPoint(point);
        const current = useStore.getState().interactionState;

        // Cell -> Cell Swap
        if (current?.type === 'cell') {
          if (current.index !== index) {
            useStore.getState().handleSwapCells(current.index, index);
            setInteractionState(null);
            setLocalClickPoint(null);
          } else {
            setInteractionState(null);
            setLocalClickPoint(null);
          }
          return;
        }

        // Inbox -> Cell Drop
        if (current?.type === 'inbox') {
          useStore.getState().handleInboxDrop(current.itemId, current.collectionId, index);
          setInteractionState(null);
          setLocalClickPoint(null);
          return;
        }

        // Multi-Inbox -> Cell Drop
        if (current?.type === 'inbox-multi') {
          useStore.getState().handleInboxDropMulti(current.itemIds, current.collectionId, index);
          setInteractionState(null);
          setLocalClickPoint(null);
          return;
        }

        // Search -> Cell Drop
        if (current?.type === 'search') {
          useStore.getState().handleSearchDrop(current.imageSrc, index);
          setInteractionState(null);
          setLocalClickPoint(null);
          return;
        }

        setInteractionState({ type: 'cell', index });
      }}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-2 shrink-0">
        <GripVertical size={16} className="text-muted group-hover:text-text transition-colors" />
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
                  <button onClick={(e) => { e.stopPropagation(); saveAdjustments(); setInteractionState(null); }} className="p-1.5 bg-primary hover:bg-primary/80 text-white rounded-full shadow-lg"><Check size={14} /></button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className="w-full h-full bg-surface-secondary border border-border shadow-sm flex flex-col items-center justify-center text-muted gap-2 cursor-pointer hover:bg-hover transition-colors group/empty"
            style={{ borderRadius }}
            onClick={(e) => {
              e.stopPropagation();
              onInteract(index, { x: e.clientX, y: e.clientY });
            }}
          >
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <Plus size={24} className="opacity-30 group-hover/empty:opacity-100 transition-opacity" />
            <span className="text-[10px] uppercase font-black tracking-widest opacity-30 group-hover/empty:opacity-100">Add</span>
          </div>
        )}

        <PopoverMenu
          isOpen={isSelected && !isAdjusting}
          onClose={() => { setInteractionState(null); setLocalClickPoint(null); }}
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
        onSubmit={(url) => { handleCellUpload(index, url); setInteractionState(null); }}
      />
    </div>
  );
});

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
              rankStyle={rank.style || 'card'}
              borderless={rank.borderless || false}
              aspectRatio={rank.aspectRatio || '3:4'}
              showNumbers={rank.showNumbers ?? true}
            />
          ))}
        </AnimatePresence>
      </SortableContext>
    </div>
  );
};