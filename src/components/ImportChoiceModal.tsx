import React from 'react';
import { Modal } from '@/components/ui/Modal';

interface ImportChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mode: 'merge' | 'overwrite') => void;
}

export const ImportChoiceModal: React.FC<ImportChoiceModalProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[300px]"
      contentClassName="p-0 overflow-hidden rounded-[22px]"
    >
      <div className="flex flex-col text-center">
        <div className="p-5 pb-4">
          <h3 className="text-[17px] font-semibold text-text mb-1">Restore Backup</h3>
          <p className="text-[13px] text-muted leading-snug px-2">
            How would you like to handle the data from this backup file?
          </p>
        </div>

        <div className="flex flex-col border-t border-border/40">
          <button
            onClick={() => onSelect('merge')}
            className="w-full py-3.5 text-[17px] text-primary font-medium hover:bg-hover active:bg-black/5 dark:active:bg-white/5 transition-colors border-b border-border/40 cursor-pointer select-none"
          >
            Merge Data
          </button>

          <button
            onClick={() => onSelect('overwrite')}
            className="w-full py-3.5 text-[17px] text-destructive font-medium hover:bg-hover active:bg-black/5 dark:active:bg-white/5 transition-colors border-b border-border/40 cursor-pointer select-none"
          >
            Overwrite All
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-3.5 text-[17px] text-muted font-medium hover:bg-hover active:bg-black/5 dark:active:bg-white/5 transition-colors cursor-pointer select-none"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
