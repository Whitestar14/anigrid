import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface PanZoomState {
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
const clampPercent = (p: number) => Math.min(Math.max(0, p), 100);
const finite = (value: number | undefined, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const readPlacement = (state: Partial<PanZoomState>): PanZoomState => ({
  zoom: clampZoom(finite(state.zoom, 1)),
  posX: clampPercent(finite(state.posX, 50)),
  posY: clampPercent(finite(state.posY, 50)),
});

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
  const [placement, setPlacement] = useState(() => readPlacement(initialState));
  const [geometry, setGeometry] = useState<Geometry | null>(null);

  /** The placement the tile will fall back to if the edit is cancelled. */
  const saved = useRef<PanZoomState>(placement);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const last = useRef<{ x: number; y: number } | null>(null);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);

  const setZoom = (value: number) =>
    setPlacement((prev) => ({ ...prev, zoom: clampZoom(value) }));

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

  /* Adopt placement written from outside (undo, import, project switch) while
     the tile is idle, so the hook cannot drift from the stored cell. */
  const { zoom: inputZoom, posX: inputPosX, posY: inputPosY } = initialState;
  useEffect(() => {
    if (isAdjusting) return;
    const next = readPlacement({ zoom: inputZoom, posX: inputPosX, posY: inputPosY });
    saved.current = next;
    setPlacement(next);
  }, [isAdjusting, inputZoom, inputPosX, inputPosY]);

  /** How far the image can travel before its edge would come into the tile. */
  const panRange = useMemo(() => {
    if (!geometry) return null;
    return {
      x: Math.max(0, (geometry.coverW * placement.zoom - geometry.boxW) / 2),
      y: Math.max(0, (geometry.coverH * placement.zoom - geometry.boxH) / 2),
    };
  }, [geometry, placement.zoom]);

  const imageStyle = useMemo<React.CSSProperties>(() => {
    const { zoom, posX, posY } = placement;
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
  }, [panRange, placement]);

  const panBy = (dx: number, dy: number) => {
    if (!panRange) return;
    setPlacement((prev) => ({
      zoom: prev.zoom,
      posX:
        panRange.x > 0
          ? clampPercent(prev.posX - (dx / panRange.x) * 50)
          : prev.posX,
      posY:
        panRange.y > 0
          ? clampPercent(prev.posY - (dy / panRange.y) * 50)
          : prev.posY,
    }));
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
      pinch.current = {
        distance: distanceBetweenPointers(),
        zoom: placement.zoom,
      };
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
        setZoom(start.zoom * (distance / start.distance));
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
      setPlacement((prev) => ({
        ...prev,
        zoom: clampZoom(prev.zoom * WHEEL_SENSITIVITY ** -e.deltaY),
      }));
    };
    box.addEventListener("wheel", onWheel, { passive: false });
    return () => box.removeEventListener("wheel", onWheel);
  }, [isAdjusting, containerRef]);

  const resetGesture = () => {
    pointers.current.clear();
    last.current = null;
    pinch.current = null;
    setIsAdjustDragging(false);
  };

  const startAdjusting = () => {
    // Enter from the saved placement so an abandoned edit never leaks in.
    setPlacement(saved.current);
    measure();
    setIsAdjusting(true);
  };

  const stopAdjusting = () => {
    setPlacement(saved.current);
    resetGesture();
    setIsAdjusting(false);
  };

  const saveAdjustments = () => {
    saved.current = placement;
    onUpdate?.(placement);
    resetGesture();
    setIsAdjusting(false);
  };

  return {
    isAdjusting,
    isAdjustDragging,
    zoom: placement.zoom,
    posX: placement.posX,
    posY: placement.posY,
    imageStyle,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp: endPointer,
    handlePointerCancel: endPointer,
    startAdjusting,
    stopAdjusting,
    saveAdjustments,
    setZoom,
  };
}
