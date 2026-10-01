
export function scheduleDockExpand(
  setExpanded: (v: boolean) => void,
  ms = 400
) {
  setTimeout(() => setExpanded(true), ms);
}

/** Window event asking the dock to re-open. See `requestDockExpand`. */
export const DOCK_EXPAND_EVENT = "dock-expand";

export function requestDockExpand(ms = 320) {
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent(DOCK_EXPAND_EVENT));
  }, ms);
}
