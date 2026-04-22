/** Drag-and-drop payloads for the library dock ↔ board */

export type InboxMultiDragPayload = {
  type: "inbox-multi";
  ids: string[];
  originCollectionId: string;
};

export type SearchDragPayload = { type: "search"; imageSrc: string };

export function writeInboxMultiDragData(
  e: React.DragEvent,
  ids: string[],
  originCollectionId: string,
) {
  const payload: InboxMultiDragPayload = {
    type: "inbox-multi",
    ids,
    originCollectionId,
  };
  e.dataTransfer.setData("application/json", JSON.stringify(payload));
  e.dataTransfer.effectAllowed = "copy";
}

export function writeSearchDragData(e: React.DragEvent, imageSrc: string) {
  const payload: SearchDragPayload = { type: "search", imageSrc };
  e.dataTransfer.setData("application/json", JSON.stringify(payload));
  e.dataTransfer.effectAllowed = "copy";
}

export function isMobileViewport() {
  return typeof window !== "undefined" && window.innerWidth < 768;
}

/** Collapse dock after starting a drag (mobile always; desktop when preference on). */
export function maybeCollapseDockOnDrag(
  setExpanded: (v: boolean) => void,
  alsoOnDesktop: boolean,
) {
  if (isMobileViewport() || alsoOnDesktop) setExpanded(false);
}

export function scheduleDockExpand(setExpanded: (v: boolean) => void, ms = 400) {
  setTimeout(() => setExpanded(true), ms);
}
