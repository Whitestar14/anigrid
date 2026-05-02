import { useState, useEffect, useRef } from 'react';

interface PanZoomState {
  zoom: number;
  posX: number;
  posY: number;
}

export function usePanZoom(
  initialState: Partial<PanZoomState> = {},
  containerRef: React.RefObject<HTMLElement | null>,
  onUpdate?: (state: PanZoomState) => void
) {
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isAdjustDragging, setIsAdjustDragging] = useState(false);
  const [zoom, setZoom] = useState(initialState.zoom || 1);
  const [posX, setPosX] = useState(initialState.posX ?? 50);
  const [posY, setPosY] = useState(initialState.posY ?? 50);

  useEffect(() => {
    const handleMouseUp = () => setIsAdjustDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (!isAdjustDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percentX = (e.movementX / rect.width) * 100 / zoom;
      const percentY = (e.movementY / rect.height) * 100 / zoom;
      setPosX(prev => Math.min(Math.max(0, prev - percentX), 100));
      setPosY(prev => Math.min(Math.max(0, prev - percentY), 100));
    };

    if (isAdjustDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isAdjustDragging, zoom, containerRef]);

  const handleWheel = (e: React.WheelEvent) => {
    if (!isAdjusting) return;
    e.stopPropagation();
    const newZoom = Math.min(Math.max(1, zoom - (e.deltaY * 0.005)), 4);
    setZoom(newZoom);
  };

  const startAdjusting = () => setIsAdjusting(true);
  const stopAdjusting = () => setIsAdjusting(false);
  
  const saveAdjustments = () => {
    onUpdate?.({ zoom, posX, posY });
    stopAdjusting();
  };

  return {
    isAdjusting,
    isAdjustDragging,
    setIsAdjustDragging,
    zoom,
    posX,
    posY,
    handleWheel,
    startAdjusting,
    stopAdjusting,
    saveAdjustments,
    setZoom,
    setPosX,
    setPosY
  };
}
