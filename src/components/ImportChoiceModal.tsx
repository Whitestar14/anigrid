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
      className="max-w-[300px] glass-panel rounded-[22px] overflow-hidden shadow-2xl border border-white/10"
      contentClassName="p-0"
    >
      <div className="flex flex-col text-center">
        <div className="p-5 pb-4">
          <h3 className="text-[17px] font-semibold text-white mb-1">Restore Backup</h3>
          <p className="text-[13px] text-white/50 leading-snug px-2">
            How would you like to handle the data from this backup file?
          </p>
        </div>

        <div className="flex flex-col border-t border-white/10">
          <button
            onClick={() => onSelect('merge')}
            className="w-full py-3.5 text-[17px] text-blue-500 font-medium hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/10"
          >
            Merge Data
          </button>

          <button
            onClick={() => onSelect('overwrite')}
            className="w-full py-3.5 text-[17px] text-red-500 font-medium hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/10"
          >
            Overwrite All
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-3.5 text-[17px] text-white/60 font-medium hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
