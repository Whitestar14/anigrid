export type InboxTab = "stash" | "search" | "picker";
export type DockSurface = "library" | "settings";

export interface InboxProps {
  requestConfirm: (title: string, message: string, action: () => void) => void;
}
