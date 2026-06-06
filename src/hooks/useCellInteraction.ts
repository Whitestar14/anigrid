import { useState, useCallback, useRef } from 'react';
import { useStore } from '@/store/useStore';

export interface CellInteractionConfig {
  type: 'cell' | 'tier-item';
  index: number;
  rowId?: string;
  itemId?: string;
}

export function useCellInteraction(config: CellInteractionConfig) {
  const [localClickPoint, setLocalClickPoint] = useState<{ x: number; y: number } | null>(null);
  const lastInteractRef = useRef<number>(0);
  
  const interactionState = useStore(s => s.interactionState);
  
  const isSelected = config.type === 'cell' 
    ? interactionState?.type === 'cell' && interactionState.index === config.index
    : interactionState?.type === 'tier-item' && interactionState.itemId === config.itemId;

  const handleInteraction = useCallback((clientX: number, clientY: number, target: HTMLElement) => {
    // Avoid triggering on controls
    if (target.closest('.popover-menu') || target.closest('.adjust-controls') || target.closest('button') || target.closest('select') || target.closest('input')) return;

    // Debounce to prevent dual tap/click events
    const now = Date.now();
    if (now - lastInteractRef.current < 200) return;
    lastInteractRef.current = now;

    const point = { x: clientX, y: clientY };
    setLocalClickPoint(point);

    const store = useStore.getState();
    const current = store.interactionState;

    if (config.type === 'cell') {
      // --- CELL LOGIC ---
      if (current?.type === 'cell') {
        if (current.index !== config.index) {
          store.handleSwapCells(current.index, config.index);
        }
        store.setInteractionState(null);
        setLocalClickPoint(null);
        return;
      }
      if (current?.type === 'inbox') {
        store.handleInboxDrop(current.itemId, current.collectionId, config.index);
        store.setInteractionState(null);
        setLocalClickPoint(null);
        return;
      }
      if (current?.type === 'inbox-multi') {
        store.handleInboxDropMulti(current.itemIds, current.collectionId, config.index);
        store.setInteractionState(null);
        setLocalClickPoint(null);
        return;
      }
      if (current?.type === 'search') {
        store.handleSearchDrop(current.imageSrc, config.index);
        store.setInteractionState(null);
        setLocalClickPoint(null);
        return;
      }
      store.setInteractionState({ type: 'cell', index: config.index });
    } else if (config.type === 'tier-item' && config.rowId) {
      // --- TIER ITEM LOGIC ---
      if (current?.type === 'inbox') {
        store.handleInboxDropToTier(current.itemId, current.collectionId, config.rowId, config.index);
        store.setInteractionState(null);
        setLocalClickPoint(null);
        return;
      }
      if (current?.type === 'inbox-multi') {
        store.handleInboxDropToTierMulti(current.itemIds, current.collectionId, config.rowId, config.index);
        store.setInteractionState(null);
        setLocalClickPoint(null);
        return;
      }
      if (current?.type === 'tier-item') {
        if (current.itemId !== config.itemId || config.itemId === undefined) {
          store.handleInternalTierMove(current.rowId, current.itemId, config.rowId, config.index);
        }
        store.setInteractionState(null);
        setLocalClickPoint(null);
        return;
      }
      if (current?.type === 'search') {
        store.handleSearchDropToTier(current.imageSrc, config.rowId, config.index);
        store.setInteractionState(null);
        setLocalClickPoint(null);
        return;
      }
      if (current?.type === 'cell') {
        const cells = store.ranks[store.activeRankId]?.cells;
        const cell = cells?.[current.index];
        if (cell?.imageSrc) {
          store.handleSearchDropToTier(cell.imageSrc, config.rowId, config.index);
          store.handleCellClear(current.index);
        }
        store.setInteractionState(null);
        setLocalClickPoint(null);
        return;
      }
      if (config.itemId !== undefined) {
        store.setInteractionState({ type: 'tier-item', rowId: config.rowId, itemId: config.itemId });
      }
    }
  }, [config.type, config.index, config.rowId, config.itemId]);

  const clearInteraction = useCallback(() => {
    useStore.getState().setInteractionState(null);
    setLocalClickPoint(null);
  }, []);

  return {
    isSelected,
    localClickPoint,
    handleInteraction,
    clearInteraction,
  };
}
