import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ImageFormat } from "@/utils/imageUtils";
import { FileImage } from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportImage: (format: ImageFormat, qualityScale: number) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExportImage,
}) => {
  const [format, setFormat] = useState<ImageFormat>("png");
  const [quality, setQuality] = useState<number>(2);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[320px] bg-[#1c1c1e]/90 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-[24px] overflow-hidden"
      contentClassName="p-0"
    >
      <div className="flex flex-col">
        <div className="p-5 pb-3 text-center border-b border-white/10">
          <h3 className="text-[17px] font-semibold text-white leading-tight">
            Export Project
          </h3>
          <p className="text-[13px] text-white/50 mt-1">
            Choose how you want to save your work.
          </p>
        </div>

        <div className="p-4 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-medium text-white/50 uppercase tracking-wider ml-1">
              Image Format
            </span>
            <div className="flex bg-[#767680]/24 p-1 rounded-xl">
              <button
                onClick={() => setFormat("png")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-colors text-[14px] font-medium ${format === "png" ? "bg-[#636366] text-white shadow-sm" : "text-white/70 hover:text-white"}`}
              >
                PNG
              </button>
              <button
                onClick={() => setFormat("jpeg")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-colors text-[14px] font-medium ${format === "jpeg" ? "bg-[#636366] text-white shadow-sm" : "text-white/70 hover:text-white"}`}
              >
                JPG
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-medium text-white/50 uppercase tracking-wider ml-1">
              Export Quality
            </span>
            <div className="flex bg-[#767680]/24 p-1 rounded-xl">
              <button
                onClick={() => setQuality(1)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-colors text-[12px] font-medium ${quality === 1 ? "bg-[#636366] text-white shadow-sm" : "text-white/70 hover:text-white"}`}
              >
                1x (SD)
              </button>
              <button
                onClick={() => setQuality(2)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-colors text-[12px] font-medium ${quality === 2 ? "bg-[#636366] text-white shadow-sm" : "text-white/70 hover:text-white"}`}
              >
                2x (HD)
              </button>
              <button
                onClick={() => setQuality(3)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-colors text-[12px] font-medium ${quality === 3 ? "bg-[#636366] text-white shadow-sm" : "text-white/70 hover:text-white"}`}
              >
                3x (4K)
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={() => {
                onExportImage(format, quality);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary text-white rounded-xl font-semibold text-[15px] transition-colors"
            >
              <FileImage size={18} />
              Save as Image
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
