import { useCallback, useEffect, useRef, useState } from "react";
import { useDndMonitor, useDroppable } from "@dnd-kit/core";

/**
 * How long the pointer must dwell over a collapsed dock before it springs open,
 * mirroring Apple's spring-loading behaviour. A short dwell keeps a drag that
 * merely passes over the dock from popping it open.
 */
const SPRING_LOAD_DELAY = 400;

interface DockDropZoneOptions {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  isDraggingFromDock: boolean;
  autoCloseOnDragDesktop: boolean;
}

/**
 * Makes the dock a drop target, highlights it during a drag, spring-loads it
 * open on dwell, and collapses it again once a dock item is dragged clear.
 */
export function useDockDropZone({
  isExpanded,
  setIsExpanded,
  isDraggingFromDock,
  autoCloseOnDragDesktop,
}: DockDropZoneOptions) {
  /** True when a drag is hovering the dock — the pre-drop highlight. */
  const [isDockHot, setIsDockHot] = useState(false);

  const { isOver: isDndOver, setNodeRef: setDroppableRef } = useDroppable({
    id: "inbox-trash",
    data: { type: "inbox-trash" },
  });

  const dockRef = useRef<HTMLDivElement>(null);
  const isDraggingFromDockRef = useRef(isDraggingFromDock);
  const timers = useRef<{ expand?: number }>({});

  useEffect(() => {
    isDraggingFromDockRef.current = isDraggingFromDock;
  }, [isDraggingFromDock]);

  useEffect(
    () => () => {
      window.clearTimeout(timers.current.expand);
    },
    []
  );

  const setDockRefs = useCallback(
    (node: HTMLDivElement | null) => {
      dockRef.current = node;
      setDroppableRef(node);
    },
    [setDroppableRef]
  );

  /** Dock bounds, measured once per drag instead of per pointer move. */
  const dockRectRef = useRef<DOMRect | null>(null);

  const clearExpandTimer = () => window.clearTimeout(timers.current.expand);

  useDndMonitor({
    onDragStart() {
      setIsDockHot(false);
      dockRectRef.current = dockRef.current?.getBoundingClientRect() ?? null;
    },
    onDragMove(event) {
      const rect = dockRectRef.current;
      const translated = event.active.rect.current.translated;
      if (!rect || !translated) return;

      // The dragged node's centre stands in for the pointer, which dnd-kit does
      // not expose on drag-move.
      const cx = translated.left + translated.width / 2;
      const cy = translated.top + translated.height / 2;
      const inside =
        cx >= rect.left &&
        cx <= rect.right &&
        cy >= rect.top &&
        cy <= rect.bottom;

      setIsDockHot(inside);
      clearExpandTimer();

      if (inside) {
        // Spring-load: a collapsed dock opens after a dwell so it can accept the
        // drop instead of silently rejecting it.
        if (!isExpanded) {
          timers.current.expand = window.setTimeout(
            () => setIsExpanded(true),
            SPRING_LOAD_DELAY
          );
        }
        return;
      }

      const isMobile = window.innerWidth < 768;
      if (
        isExpanded &&
        isDraggingFromDockRef.current &&
        (isMobile || autoCloseOnDragDesktop)
      ) {
        setIsExpanded(false);
      }
    },
    onDragEnd() {
      setIsDockHot(false);
      dockRectRef.current = null;
      clearExpandTimer();
    },
    onDragCancel() {
      setIsDockHot(false);
      dockRectRef.current = null;
      clearExpandTimer();
    },
  });

  return { isDockHot, isDndOver, setDockRefs };
}
