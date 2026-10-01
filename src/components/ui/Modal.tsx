import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerAction?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  contentClassName,
  headerAction,
}) => {
  const panelRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    const bodyScrolls = document.body.scrollHeight > window.innerHeight + 1;
    if (bodyScrolls) document.body.style.overflow = "hidden";

    // `preventScroll` so focusing the panel can never scroll an ancestor scroller
    // to reveal it — the panel is centred, so there is nothing to reveal.
    panelRef.current?.focus({ preventScroll: true });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (bodyScrolls) document.body.style.overflow = previousOverflow;
      // Restoring focus must not scroll the board back to whatever was focused
      // before the dialog opened.
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [isOpen, onClose]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Dim only — no `backdrop-blur-sm`. See the note above the component. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: "linear" }}
            className="absolute inset-0 bg-overlay"
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
            style={{ willChange: "opacity, transform" }}
            className={cn(
              "relative w-full max-h-[85vh] flex flex-col overflow-hidden outline-none",
              "material-thick squircle rounded-panel",
              className
            )}
          >
            {title &&
              (headerAction ? (
                <div className="relative flex items-center justify-between gap-4 px-3 h-12 shrink-0 border-b border-border">
                  <span aria-hidden className="w-16 shrink-0" />
                  <h2 className="absolute left-1/2 -translate-x-1/2 max-w-[62%] truncate text-headline font-semibold text-text">
                    {title}
                  </h2>
                  <div className="flex items-center shrink-0">
                    {headerAction}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4 px-6 py-4 shrink-0 border-b border-border">
                  <h2 className="text-headline font-semibold text-text truncate">
                    {title}
                  </h2>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full
                               bg-surface-secondary text-muted hover:text-text
                               transition-colors duration-150 touch-target"
                  >
                    <X className="w-4 h-4" strokeWidth={2.4} />
                  </button>
                </div>
              ))}

            <div
              className={cn(
                "px-6 py-5 overflow-y-auto scrollbar-ios",
                contentClassName
              )}
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
