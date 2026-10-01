import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface PanZoomState {
  zoom: number;
  posX: number;
  posY: number;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
/** Per-wheel-notch zoom factor, applied exponentially so it feels the same at
 *  every zoom level. */
const WHEEL_SENSITIVITY = 1.0018;

const clampZoom = (z: number) => Math.min(Math.max(MIN_ZOOM, z), MAX_ZOOM);

interface Geometry {
  boxW: number;
  boxH: number;
  /** Size of the image once `object-fit: cover` has been applied. */
  coverW: number;
  coverH: number;
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
  const [geometry, setGeometry] = useState<Geometry | null>(null);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const last = useRef<{ x: number; y: number } | null>(null);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);

  const measure = useCallback(() => {
    const box = containerRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const img = box.querySelector("img");
    const naturalW = img?.naturalWidth ?? 0;
    const naturalH = img?.naturalHeight ?? 0;
    if (!rect.width || !rect.height || !naturalW || !naturalH) return;
    const cover = Math.max(rect.width / naturalW, rect.height / naturalH);
    setGeometry({
      boxW: rect.width,
      boxH: rect.height,
      coverW: naturalW * cover,
      coverH: naturalH * cover,
    });
  }, [containerRef]);

  // Re-measure when the tile resizes and when the image finally decodes.
  useEffect(() => {
    measure();
    const box = containerRef.current;
    if (!box) return;
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    box.addEventListener("load", measure, true);
    return () => {
      observer.disconnect();
      box.removeEventListener("load", measure, true);
    };
  }, [measure, containerRef]);

  /** How far the image can travel before its edge would come into the tile. */
  const panRange = useMemo(() => {
    if (!geometry) return null;
    return {
      x: Math.max(0, (geometry.coverW * zoom - geometry.boxW) / 2),
      y: Math.max(0, (geometry.coverH * zoom - geometry.boxH) / 2),
    };
  }, [geometry, zoom]);

  const imageStyle = useMemo<React.CSSProperties>(() => {
    if (!panRange || (panRange.x === 0 && panRange.y === 0)) {
      // Nothing to pan (the image fills the tile exactly): fall back to the
      // plain object-position reading of the same values.
      return {
        objectPosition: `${posX}% ${posY}%`,
        transform: `scale(${zoom})`,
      };
    }
    return {
      objectPosition: "center",
      transform: `translate(${
        ((50 - posX) / 50) * panRange.x
      }px, ${((50 - posY) / 50) * panRange.y}px) scale(${zoom})`,
    };
  }, [panRange, posX, posY, zoom]);

  const panBy = (dx: number, dy: number) => {
    if (!panRange) return;
    if (panRange.x > 0) {
      setPosX((prev) =>
        Math.min(Math.max(0, prev - (dx / panRange.x) * 50), 100)
      );
    }
    if (panRange.y > 0) {
      setPosY((prev) =>
        Math.min(Math.max(0, prev - (dy / panRange.y) * 50), 100)
      );
    }
  };

  const distanceBetweenPointers = () => {
    const [a, b] = [...pointers.current.values()];
    if (!a || !b) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      last.current = { x: e.clientX, y: e.clientY };
      setIsAdjustDragging(true);
    } else {
      // A second finger cancels the drag and starts a pinch instead.
      last.current = null;
      pinch.current = { distance: distanceBetweenPointers(), zoom };
    }
    measure();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2) {
      const start = pinch.current;
      const distance = distanceBetweenPointers();
      if (start && start.distance > 0 && distance > 0) {
        setZoom(clampZoom(start.zoom * (distance / start.distance)));
      }
      return;
    }

    const previous = last.current;
    if (!previous) return;
    last.current = { x: e.clientX, y: e.clientY };
    panBy(e.clientX - previous.x, e.clientY - previous.y);
  };

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      last.current = null;
      pinch.current = null;
      setIsAdjustDragging(false);
    } else {
      pinch.current = null;
      const [remaining] = [...pointers.current.values()];
      last.current = remaining ?? null;
    }
  };

  /* The wheel listener has to be registered by hand: React attaches `onWheel`
     passively, so `preventDefault()` there does nothing and zooming also
     scrolled the board behind the tile. */
  useEffect(() => {
    if (!isAdjusting) return;
    const box = containerRef.current;
    if (!box) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setZoom((prev) => clampZoom(prev * WHEEL_SENSITIVITY ** -e.deltaY));
    };
    box.addEventListener("wheel", onWheel, { passive: false });
    return () => box.removeEventListener("wheel", onWheel);
  }, [isAdjusting, containerRef]);

  const startAdjusting = () => {
    measure();
    setIsAdjusting(true);
  };
  const stopAdjusting = () => setIsAdjusting(false);

  const saveAdjustments = () => {
    onUpdate?.({ zoom, posX, posY });
    stopAdjusting();
  };

  return {
    isAdjusting,
    isAdjustDragging,
    zoom,
    posX,
    posY,
    imageStyle,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp: endPointer,
    handlePointerCancel: endPointer,
    startAdjusting,
    stopAdjusting,
    saveAdjustments,
    setZoom: (v: number) => setZoom(clampZoom(v)),
    setPosX,
    setPosY,
  };
}
