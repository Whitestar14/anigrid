import { create } from "zustand";

interface CommandState {
  isOpen: boolean;
  /** The ⌘/ cheat sheet, kept here so the keyboard hook can open it too. */
  isShortcutsOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  toggleShortcuts: () => void;
  closeShortcuts: () => void;
}

export const useCommandState = create<CommandState>((set, get) => ({
  isOpen: false,
  isShortcutsOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set({ isOpen: !get().isOpen }),
  toggleShortcuts: () => set({ isShortcutsOpen: !get().isShortcutsOpen }),
  closeShortcuts: () => set({ isShortcutsOpen: false }),
}));
