import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ImageFormat } from "@/utils/imageUtils";
import { FileImage, Copy } from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";

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
          <h3 className="text-body font-semibold text-text leading-tight">
            Export Project
          </h3>
          <p className="text-footnote text-muted mt-1">
            Choose how you want to save your work.
          </p>
        </div>

        <div className="p-4 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-caption-1 font-medium text-muted uppercase tracking-wider ml-1">
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
            <span className="text-caption-1 font-medium text-muted uppercase tracking-wider ml-1">
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
            <Button
              fullWidth
              size="lg"
              icon={<FileImage size={18} />}
              onClick={() => {
                onExportImage(format, quality);
                onClose();
              }}
            >
              Save as Image
            </Button>
            <Button
              fullWidth
              size="lg"
              variant="gray"
              icon={<Copy size={18} />}
              onClick={() => {
                if (onCopyImage) onCopyImage(quality);
                onClose();
              }}
            >
              Copy to Clipboard
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
