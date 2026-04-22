import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Globe } from "lucide-react";

interface UrlInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
}

/**
 * iOS-style modal for entering an image URL.
 * Replaces all uses of the native prompt() dialog.
 */
export const UrlInputModal: React.FC<UrlInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl("");
      // Small delay so the modal animation finishes before we focus
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[270px] rounded-[20px]"
      contentClassName="p-0"
    >
      <div className="flex flex-col text-center">
        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-primary/15 rounded-full p-2.5">
              <Globe size={20} className="text-primary" />
            </div>
          </div>
          <h3 className="text-[17px] font-semibold text-white mb-1 leading-tight">
            Image URL
          </h3>
          <p className="text-[13px] text-white/50 leading-snug">
            Paste a direct link to any image
          </p>
        </div>

        {/* Input */}
        <div className="px-5 pb-4">
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") onClose();
            }}
            placeholder="https://..."
            className="w-full px-4 py-2.5 text-[15px] text-white bg-white/8 rounded-xl border border-white/10 focus:outline-none focus:border-primary/50 placeholder:text-white/25 transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="flex border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-[17px] text-blue-500 font-normal hover:bg-white/5 transition-colors border-r border-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!url.trim()}
            className="flex-1 py-3 text-[17px] text-blue-500 font-semibold hover:bg-white/5 transition-colors disabled:opacity-30"
          >
            Add
          </button>
        </div>
      </div>
    </Modal>
  );
};
