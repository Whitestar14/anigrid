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
      contentClassName="p-0"
    >
      <div className="flex flex-col text-center">
        <div className="p-5 pb-4">
          <h3 className="text-[17px] font-semibold text-text mb-1">Restore Backup</h3>
          <p className="text-[13px] text-muted leading-snug px-2">
            How would you like to handle the data from this backup file?
          </p>
        </div>

        <div className="flex flex-col border-t border-border">
          <button
            onClick={() => onSelect('merge')}
            className="w-full py-3.5 text-[17px] text-blue-500 font-medium hover:bg-hover active:bg-active transition-colors border-b border-border"
          >
            Merge Data
          </button>

          <button
            onClick={() => onSelect('overwrite')}
            className="w-full py-3.5 text-[17px] text-red-500 font-medium hover:bg-hover active:bg-active transition-colors border-b border-border"
          >
            Overwrite All
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-3.5 text-[17px] text-muted font-medium hover:bg-hover active:bg-active transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
