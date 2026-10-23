import React, { useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PixelIcon, type PixelIconName } from "@/components/pixel/PixelIcon";
import { motion as motionPreset } from "@/lib/motion";

export type ToastType = "success" | "info" | "error";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  actionLabel?: string;
  action?: () => void;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const TOAST_LIFE = 3400;

const TONES: Record<ToastType, { icon: PixelIconName; color: string }> = {
  success: { icon: "check", color: "var(--color-accent-green)" },
  error: { icon: "alert", color: "var(--color-destructive)" },
  info: { icon: "info", color: "var(--color-primary)" },
};

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onRemove }) => (
  <div
    aria-live="polite"
    aria-atomic="false"
    className="fixed inset-x-0 z-toast flex flex-col items-center gap-1.5 px-4 pointer-events-none"
    style={{ top: "calc(4rem + env(safe-area-inset-top, 0px))" }}
  >
    <AnimatePresence mode="popLayout" initial={false}>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </AnimatePresence>
  </div>
);

const Toast: React.FC<{
  toast: ToastMessage;
  onRemove: (id: string) => void;
}> = ({ toast, onRemove }) => {
  const tone = TONES[toast.type];
  const timer = useRef<number | undefined>(undefined);

  const dismiss = useCallback(() => onRemove(toast.id), [onRemove, toast.id]);

  const startTimer = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(dismiss, TOAST_LIFE);
  }, [dismiss]);

  const pauseTimer = useCallback(() => {
    window.clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    startTimer();
    return () => window.clearTimeout(timer.current);
  }, [startTimer]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={motionPreset.snappy}
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
      onFocusCapture={pauseTimer}
      onBlurCapture={startTimer}
      className="pointer-events-auto flex max-w-[min(92vw,30rem)] items-center gap-2.5
                 pl-2 pr-3.5 py-2 material-thick squircle rounded-full"
    >
      <span
        aria-hidden
        className="grid place-items-center w-[26px] h-[26px] shrink-0 rounded-full"
        style={{
          color: tone.color,
          backgroundColor: `color-mix(in srgb, ${tone.color} 15%, transparent)`,
        }}
      >
        <PixelIcon name={tone.icon} size={18} />
      </span>

      <span className="min-w-0 text-footnote font-medium text-text leading-snug">
        {toast.message}
      </span>

      {toast.action && toast.actionLabel && (
        <button
          type="button"
          onClick={() => {
            toast.action?.();
            dismiss();
          }}
          className="shrink-0 ml-0.5 px-2 h-7 rounded-full text-footnote font-semibold
                     text-primary hover:bg-hover active:opacity-70
                     transition-colors duration-150"
        >
          {toast.actionLabel}
        </button>
      )}
    </motion.div>
  );
};
