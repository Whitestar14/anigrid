import { create } from "zustand";

/** Visibility flags for the app's dialogs, and the confirm sheet's request.
 *  Kept out of `useAppController` so that opening a dialog does not re-render
 *  the board, rail, dock and every other modal. */
interface ConfirmRequest {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

interface ModalState {
  isExportOpen: boolean;
  isAboutOpen: boolean;
  confirm: ConfirmRequest;

  openExport: () => void;
  closeExport: () => void;
  openAbout: () => void;
  closeAbout: () => void;

  requestConfirm: (title: string, message: string, action: () => void) => void;
  closeConfirm: () => void;
}

const emptyConfirm: ConfirmRequest = {
  isOpen: false,
  title: "",
  message: "",
  onConfirm: () => {},
};

export const useModalState = create<ModalState>((set) => ({
  isExportOpen: false,
  isAboutOpen: false,
  confirm: emptyConfirm,

  openExport: () => set({ isExportOpen: true }),
  closeExport: () => set({ isExportOpen: false }),
  openAbout: () => set({ isAboutOpen: true }),
  closeAbout: () => set({ isAboutOpen: false }),

  requestConfirm: (title, message, action) =>
    set({
      confirm: {
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          action();
          set({ confirm: emptyConfirm });
        },
      },
    }),
  closeConfirm: () => set({ confirm: emptyConfirm }),
}));
