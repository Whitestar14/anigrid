import { create } from "zustand";

/**
 * The ⌘/ cheat sheet's open state.
 *
 * This module used to be `commandState` and held two things: the ⌘K command
 * palette and the shortcut sheet. The palette was removed — a searchable list
 * of six actions is more machinery than this app needs — so what is left is one
 * boolean. It is named for what it actually holds now.
 *
 * It stays in a store rather than local state because the keyboard hook, the
 * dock's settings panel and the app controller all need to open it from
 * different branches of the tree.
 */
interface ShortcutState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useShortcutState = create<ShortcutState>((set, get) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set({ isOpen: !get().isOpen }),
}));
