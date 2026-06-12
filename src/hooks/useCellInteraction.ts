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
        store.handleItemTransfer({ type: "inbox", collectionId: current.collectionId, itemId: current.itemId }, { type: "cell", index: config.index });
        store.setInteractionState(null);
        setLocalClickPoint(null);
        return;
      }
      if (current?.type === 'inbox-multi') {
        store.handleItemTransfer({ type: "inbox", collectionId: current.collectionId }, { type: "cell", index: config.index }, current.itemIds);
        store.setInteractionState(null);
        setLocalClickPoint(null);
        return;
      }
      if (current?.type === 'search') {
        store.handleItemTransfer({ type: "search", imageSrc: current.imageSrc }, { type: "cell", index: config.index });
        store.setInteractionState(null);
        setLocalClickPoint(null);
        return;
      }
      store.setInteractionState({ type: 'cell', index: config.index });
    } else if (config.type === 'tier-item' && config.rowId) {
      // --- TIER ITEM LOGIC ---
      if (current?.type === 'inbox') {
        store.handleItemTransfer({ type: "inbox", collectionId: current.collectionId, itemId: current.itemId }, { type: "tier", rowId: config.rowId, targetIndex: config.index });
        store.setInteractionState(null);
        setLocalClickPoint(null);
        return;
      }
      if (current?.type === 'inbox-multi') {
        store.handleItemTransfer({ type: "inbox", collectionId: current.collectionId }, { type: "tier", rowId: config.rowId, targetIndex: config.index }, current.itemIds);
        store.setInteractionState(null);
        setLocalClickPoint(null);
        return;
      }
      if (current?.type === 'tier-item') {
        if (current.itemId !== config.itemId || config.itemId === undefined) {
          store.handleItemTransfer({ type: "tier", rowId: current.rowId, itemId: current.itemId }, { type: "tier", rowId: config.rowId, targetIndex: config.index });
        }
        store.setInteractionState(null);
        setLocalClickPoint(null);
        return;
      }
      if (current?.type === 'search') {
        store.handleItemTransfer({ type: "search", imageSrc: current.imageSrc }, { type: "tier", rowId: config.rowId, targetIndex: config.index });
        store.setInteractionState(null);
        setLocalClickPoint(null);
        return;
      }
      if (current?.type === 'cell') {
        store.handleItemTransfer({ type: "cell", index: current.index }, { type: "tier", rowId: config.rowId, targetIndex: config.index });
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
