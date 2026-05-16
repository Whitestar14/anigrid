import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ImageFormat } from "@/utils/imageUtils";
import { FileImage, Copy } from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportImage: (format: ImageFormat, qualityScale: number) => void;
  onCopyImage?: (qualityScale: number) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExportImage,
  onCopyImage,
}) => {
  const [format, setFormat] = useState<ImageFormat>("png");
  const [quality, setQuality] = useState<number>(2);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[320px]"
      contentClassName="p-0"
    >
      <div className="flex flex-col">
        <div className="p-5 pb-3 text-center border-b border-border">
          <h3 className="text-[17px] font-semibold text-text leading-tight">
            Export Project
          </h3>
          <p className="text-[13px] text-muted mt-1">
            Choose how you want to save your work.
          </p>
        </div>

        <div className="p-4 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-medium text-muted uppercase tracking-wider ml-1">
              Image Format
            </span>
            <SegmentedControl
              value={format}
              onChange={(val) => setFormat(val as ImageFormat)}
              options={[
                { value: "png", label: "PNG" },
                { value: "jpeg", label: "JPG" }
              ]}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-medium text-muted uppercase tracking-wider ml-1">
              Export Quality
            </span>
            <SegmentedControl
              value={quality.toString()}
              onChange={(val) => setQuality(parseInt(val))}
              options={[
                { value: "1", label: "1x (SD)" },
                { value: "2", label: "2x (HD)" },
                { value: "3", label: "3x (4K)" }
              ]}
            />
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={() => {
                onExportImage(format, quality);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-white rounded-full font-semibold text-[15px] transition-colors shadow-md shadow-primary/20"
            >
              <FileImage size={18} />
              Save as Image
            </button>
            <button
              onClick={() => {
                if (onCopyImage) onCopyImage(quality);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-surface-elevated hover:bg-hover text-text border border-border rounded-full font-semibold text-[15px] transition-colors"
            >
              <Copy size={18} />
              Copy to Clipboard
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
