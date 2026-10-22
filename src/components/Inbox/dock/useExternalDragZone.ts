import { useEffect, useState } from "react";

/** MIME types that mean "something is being dragged in from outside". */
const EXTERNAL_TYPES = ["Files", "text/uri-list", "text/html"];
const IDLE_TIMEOUT = 400;

/**
 * True while a file or image dragged from another window is over this one.
 * `dragover` fires continuously during such a drag but never on the frame the
 * pointer leaves the window, so a short idle timer is what ends the state.
 */
export function useExternalDragZone() {
  const [isExternalDrag, setIsExternalDrag] = useState(false);

  useEffect(() => {
    const isExternal = (e: DragEvent) =>
      Array.from(e.dataTransfer?.types ?? []).some((t) =>
        EXTERNAL_TYPES.includes(t)
      );

    let idle: number | undefined;
    const stop = () => {
      window.clearTimeout(idle);
      setIsExternalDrag(false);
    };

    const handleOver = (e: DragEvent) => {
      if (!isExternal(e)) return;
      setIsExternalDrag(true);
      window.clearTimeout(idle);
      idle = window.setTimeout(() => setIsExternalDrag(false), IDLE_TIMEOUT);
    };

    const swallow = (e: DragEvent) => {
      if (isExternal(e)) e.preventDefault();
      stop();
    };

    window.addEventListener("dragover", handleOver);
    window.addEventListener("dragover", swallow);
    window.addEventListener("drop", swallow);
    window.addEventListener("dragend", stop);
    return () => {
      window.clearTimeout(idle);
      window.removeEventListener("dragover", handleOver);
      window.removeEventListener("dragover", swallow);
      window.removeEventListener("drop", swallow);
      window.removeEventListener("dragend", stop);
    };
  }, []);

  return isExternalDrag;
}
