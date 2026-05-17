import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Toggle } from '@/components/ui/Toggle';

interface DuplicateModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onConfirm: (dontAskAgain: boolean) => void;
  onCancel: () => void;
}

export const DuplicateModal: React.FC<DuplicateModalProps> = ({
  isOpen,
  imageSrc,
  onConfirm,
  onCancel
}) => {
  const [dontAsk, setDontAsk] = useState(false);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onCancel} 
      className="max-w-[270px]"
      contentClassName="p-0 overflow-hidden rounded-[22px]"
    >
      <div className="flex flex-col text-center">
          <div className="p-5 pb-4 flex flex-col items-center">
              <h3 className="text-[17px] font-semibold text-text mb-1 leading-tight">Duplicate Item</h3>
              <p className="text-[13px] text-muted leading-snug mb-4">
                  This image is already in your current project. Add it again?
              </p>

              {imageSrc && (
                  <div className="w-16 h-20 rounded-lg overflow-hidden border border-border/60 relative shadow-sm mb-4">
                      <img src={imageSrc} className="w-full h-full object-cover" />
                  </div>
              )}

              <div className="flex items-center justify-between gap-2 cursor-pointer text-[13px] text-text hover:text-text transition-colors select-none w-full" onClick={() => setDontAsk(!dontAsk)}>
                  <span>Don't ask again</span>
                  <Toggle checked={dontAsk} onCheckedChange={setDontAsk} />
              </div>
          </div>

          <div className="flex border-t border-border/40">
              <button 
                  onClick={onCancel}
                  className="flex-1 py-3 text-[17px] text-primary font-normal hover:bg-hover active:bg-black/5 dark:active:bg-white/5 transition-colors border-r border-border/40 cursor-pointer select-none"
              >
                  Cancel
              </button>
              <button 
                  onClick={() => onConfirm(dontAsk)}
                  className="flex-1 py-3 text-[17px] text-primary font-semibold hover:bg-hover active:bg-black/5 dark:active:bg-white/5 transition-colors cursor-pointer select-none"
              >
                  Add
              </button>
          </div>
      </div>
    </Modal>
  );
};
