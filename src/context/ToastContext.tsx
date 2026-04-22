import React, { createContext, useCallback, useContext, useState } from "react";
import {
  ToastContainer,
  ToastMessage,
  ToastType,
} from "@/components/ui/Toast";

type AddToast = (
  type: ToastType,
  message: string,
  actionLabel?: string,
  action?: () => void,
) => void;

const ToastContext = createContext<AddToast | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback<AddToast>((type, message, actionLabel, action) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message, actionLabel, action }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export function useToast(): AddToast {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
